ALTER TABLE clarification_request ADD COLUMN response_source TEXT;
ALTER TABLE clarification_request ADD COLUMN material_change BOOLEAN NOT NULL DEFAULT false;
-- Legacy combined response/source is retained verbatim. Staff must supply a separate
-- source and disposition before a still-pending legacy response can be approved.
CREATE TABLE clarification_disposition(
 id UUID PRIMARY KEY,
 clarification_id UUID NOT NULL REFERENCES clarification_request(id),
 revision INTEGER NOT NULL CHECK(revision>0),
 outcome TEXT NOT NULL CHECK(outcome IN ('ApprovedInstruction','Rejected','Escalated')),
 instruction TEXT,
 staff_id UUID NOT NULL REFERENCES staff_member(id),
 reason TEXT NOT NULL CHECK(length(btrim(reason))>0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(clarification_id,revision),
 CHECK((outcome='ApprovedInstruction' AND instruction IS NOT NULL AND instruction IN
 ('Use the north entrance.','Use the south entrance.','Call the venue contact on arrival.'))
 OR (outcome<>'ApprovedInstruction' AND instruction IS NULL))
);
CREATE TRIGGER disposition_immutable BEFORE UPDATE OR DELETE ON clarification_disposition FOR EACH ROW EXECUTE FUNCTION immutable_record();
CREATE TABLE order_instruction(
 id UUID PRIMARY KEY,
 order_id UUID NOT NULL REFERENCES catering_order(id),
 disposition_id UUID NOT NULL UNIQUE REFERENCES clarification_disposition(id),
 instruction TEXT NOT NULL CHECK(length(btrim(instruction))>0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER instruction_immutable BEFORE UPDATE OR DELETE ON order_instruction FOR EACH ROW EXECUTE FUNCTION immutable_record();
CREATE FUNCTION protect_clarification_response() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Clarification evidence is immutable'; END IF;
 IF NEW.booking_id IS DISTINCT FROM OLD.booking_id OR NEW.question IS DISTINCT FROM OLD.question OR NEW.staff_id IS DISTINCT FROM OLD.staff_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Clarification source is immutable'; END IF;
 IF OLD.resolved_at IS NOT NULL AND (NEW.response IS DISTINCT FROM OLD.response OR NEW.resolved_by IS DISTINCT FROM OLD.resolved_by OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at) THEN RAISE EXCEPTION 'Recorded response is immutable'; END IF;
 IF OLD.response_source IS NOT NULL AND NEW.response_source IS DISTINCT FROM OLD.response_source THEN RAISE EXCEPTION 'Response evidence source is immutable'; END IF;
 IF OLD.material_change AND NOT NEW.material_change THEN RAISE EXCEPTION 'Material changes require a future amendment process'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER clarification_evidence_immutable BEFORE UPDATE OR DELETE ON clarification_request FOR EACH ROW EXECUTE FUNCTION protect_clarification_response();
CREATE FUNCTION check_instruction_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM catering_order o JOIN booking b ON b.id=o.booking_id
 JOIN clarification_request c ON c.booking_id=b.id
 JOIN clarification_disposition d ON d.clarification_id=c.id
 WHERE o.id=NEW.order_id AND b.status='Approved' AND d.id=NEW.disposition_id
 AND d.outcome='ApprovedInstruction' AND NOT c.material_change AND d.instruction=NEW.instruction
 AND NOT EXISTS(SELECT 1 FROM clarification_disposition newer WHERE newer.clarification_id=c.id AND newer.revision>d.revision))
 THEN RAISE EXCEPTION 'Instruction must snapshot the current approved disposition during confirmation'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER instruction_snapshot_guard BEFORE INSERT ON order_instruction FOR EACH ROW EXECUTE FUNCTION check_instruction_snapshot();
