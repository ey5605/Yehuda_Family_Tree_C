const enc=new TextEncoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unb64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export async function passwordHash(password,salt=crypto.getRandomValues(new Uint8Array(16))){
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:100000,salt},key,256);
 return `pbkdf2:100000:${b64(salt)}:${b64(bits)}`;
}
export async function verifyPassword(password,hash){
 if(typeof password!=='string'||password.length>512||!/^pbkdf2:100000:[\w-]{22}:[\w-]{43}$/.test(hash||''))return false;
 const actual=await passwordHash(password,unb64(hash.split(':')[2]));
 let diff=actual.length^hash.length;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^hash.charCodeAt(i);return diff===0;
}
async function key(secret){if(!secret||secret.length<32)throw Error('יש להגדיר SESSION_SECRET באורך 32 תווים לפחות');return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
export async function fingerprint(value,secret){return b64(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(value)))}
export async function issueSession(role,config,now=Date.now()){
 const hash=role==='editor'?config.EDIT_PASSWORD_HASH:config.VIEW_PASSWORD_HASH;
 const body=b64(enc.encode(JSON.stringify({role,exp:Math.floor(now/1000)+43200,version:await fingerprint(hash,config.SESSION_SECRET),nonce:crypto.randomUUID()})));
 return body+'.'+await fingerprint(body,config.SESSION_SECRET);
}
export async function verifySession(token,config,now=Date.now()){
 try{if(!token||token.length>2048)return null;const [body,sig,...rest]=token.split('.');if(rest.length||!sig)return null;
 if(!await crypto.subtle.verify('HMAC',await key(config.SESSION_SECRET),unb64(sig),enc.encode(body)))return null;
 const p=JSON.parse(new TextDecoder().decode(unb64(body)));if(!['viewer','editor'].includes(p.role)||!Number.isFinite(p.exp)||p.exp<=now/1000||p.exp>now/1000+43201)return null;
 const hash=p.role==='editor'?config.EDIT_PASSWORD_HASH:config.VIEW_PASSWORD_HASH;if(!hash||p.version!==await fingerprint(hash,config.SESSION_SECRET))return null;return p.role;
 }catch{return null}
}
