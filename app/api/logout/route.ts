import {sameOrigin,failure} from '@/lib/access';
export async function POST(req:Request){try{sameOrigin(req);return new Response(null,{status:303,headers:{Location:'/login','Cache-Control':'no-store','Set-Cookie':`yehuda_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${new URL(req.url).protocol==='https:'?'; Secure':''}`}})}catch(e){return failure(e)}}
