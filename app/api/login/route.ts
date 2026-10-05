import {env} from 'cloudflare:workers';
import {database} from '@/db';
import {sameOrigin,failure} from '@/lib/access';
import {verifyPassword,issueSession,fingerprint} from '@/lib/password-auth.mjs';
export async function POST(req:Request){try{
 sameOrigin(req);if(!env.SESSION_SECRET||!env.VIEW_PASSWORD_HASH||!env.EDIT_PASSWORD_HASH)return new Response('האתר טרם הוגדר. מנהל האתר צריך להגדיר את סיסמאות המשפחה בשירות האירוח.',{status:503});
 if(Number(req.headers.get('content-length'))>4096)return new Response('בקשה גדולה מדי',{status:413});
 const raw=await req.text();if(raw.length>4096)return new Response('בקשה גדולה מדי',{status:413});
 const {password,role}=JSON.parse(raw);if(!['viewer','editor'].includes(role))return new Response('יש לבחור הרשאה',{status:422});
 const db=database(),now=Math.floor(Date.now()/1000),bucket=Math.floor(now/900);
 const id=await fingerprint((req.headers.get('cf-connecting-ip')||'local')+':'+bucket,env.SESSION_SECRET);
 await db.prepare('DELETE FROM login_attempts WHERE expires_at < ?').bind(now).run();
 const attempt=await db.prepare('INSERT INTO login_attempts(id, attempts, expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(id,(bucket+1)*900).first<{attempts:number}>();
 if(!attempt||attempt.attempts>10)return new Response('יותר מדי ניסיונות. נסו שוב בעוד 15 דקות.',{status:429,headers:{'Retry-After':'900'}});
 const hash=role==='editor'?env.EDIT_PASSWORD_HASH:env.VIEW_PASSWORD_HASH;
 if(!await verifyPassword(password,hash))return new Response('הסיסמה אינה נכונה להרשאה שנבחרה',{status:401});
 const token=await issueSession(role,env);return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':`yehuda_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${new URL(req.url).protocol==='https:'?'; Secure':''}`}});
 }catch(e){return failure(e)}}
