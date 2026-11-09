ALTER TABLE feasibility_review ADD CONSTRAINT one_demo_feasibility_per_booking UNIQUE(booking_id);
CREATE FUNCTION protect_analysis_source() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.inquiry_id IS DISTINCT FROM OLD.inquiry_id OR NEW.source_reference IS DISTINCT FROM OLD.source_reference OR NEW.generated_output IS DISTINCT FROM OLD.generated_output OR NEW.model_identifier IS DISTINCT FROM OLD.model_identifier THEN RAISE EXCEPTION 'AI source and generated proposal are immutable'; END IF;
 IF OLD.review_status<>'Proposed' THEN RAISE EXCEPTION 'Completed AI review is immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER ai_source_immutable BEFORE UPDATE ON ai_analysis FOR EACH ROW EXECUTE FUNCTION protect_analysis_source();
CREATE TABLE feasibility_acknowledgement(id UUID PRIMARY KEY, booking_id UUID NOT NULL REFERENCES booking(id), staff_id UUID NOT NULL REFERENCES staff_member(id), booking_version INTEGER NOT NULL, notes TEXT NOT NULL CHECK(length(btrim(notes))>0), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TRIGGER feasibility_ack_immutable BEFORE UPDATE OR DELETE ON feasibility_acknowledgement FOR EACH ROW EXECUTE FUNCTION immutable_record();
