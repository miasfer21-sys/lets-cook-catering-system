import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewData, execute, WorkflowError } from '@/lib/workflow';
import { ZodError } from 'zod';
export const dynamic='force-dynamic';
async function staffId(){ const session=await getServerSession(authOptions);const id=(session as any)?.staffId;if(!id)throw new WorkflowError('Sign in required.',401);return id; }
function failure(e:unknown){if(e instanceof WorkflowError)return Response.json({error:e.message},{status:e.status});if(e instanceof ZodError)return Response.json({error:'Invalid request or quote data.'},{status:400});console.error('Workflow persistence failure');return Response.json({error:'Core service unavailable or persistence failed. No success is claimed. Refresh before retrying.'},{status:503});}
export async function GET(){try{return Response.json(await reviewData(await staffId()),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const origin=request.headers.get('origin');
 if(!origin||origin!==new URL(process.env.NEXTAUTH_URL!).origin)throw new WorkflowError('Same-origin request required.',403);
 if(Number(request.headers.get('content-length')||0)>20000)throw new WorkflowError('Request too large.',413);
 return Response.json(await execute(await staffId(),await request.json()));
}catch(e){return failure(e);}}
