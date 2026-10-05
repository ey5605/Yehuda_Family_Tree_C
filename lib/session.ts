// Shared family passwords. Browser identity headers are never trusted.
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {env} from 'cloudflare:workers';
import {verifySession} from '@/lib/password-auth.mjs';
export async function getFamilySession(){
 const h=await headers();const token=(h.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('yehuda_session='))?.slice(15);
 const role=await verifySession(token,env);return role?{userId:'family-'+role,email:'',displayName:role==='editor'?'עריכה משפחתית':'צפייה משפחתית',role}:null;
}
export async function requireFamilySession(_returnTo:string){const user=await getFamilySession();if(!user)redirect('/login');return user}
