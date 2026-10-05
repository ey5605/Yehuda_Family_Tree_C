import {getFamilySession} from '@/lib/session';
import {database} from '@/db';
export async function access(write=false){const user=await getFamilySession();if(!user)throw new Response('נדרשת התחברות',{status:401});const db=database();
await db.prepare('INSERT OR IGNORE INTO tree_state(id, owner_id, owner_email, revision, updated_at) VALUES(?, ?, ?, 0, ?)').bind('family','family-editor','',new Date().toISOString()).run();
const state=await db.prepare('SELECT * FROM tree_state WHERE id = ?').bind('family').first<any>();const role=user.role;
if(!role||write&&role==='viewer')throw new Response('אין הרשאה לפעולה זו',{status:403});return {user,role,state};}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw new Response('בקשה ממקור אחר נדחתה',{status:403});}
export function failure(e:unknown){if(e instanceof Response)return e;console.error('Family tree request failed',e);return Response.json({error:e instanceof Error?e.message:'הפעולה נכשלה. הנתונים הקיימים לא השתנו.'},{status:503,headers:{'Cache-Control':'no-store'}})}
