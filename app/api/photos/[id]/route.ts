import {database,bucket} from '@/db';
import {access,failure} from '@/lib/access';
export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{await access();const {id}=await params;const photo=await database().prepare('SELECT * FROM photos WHERE id = ?').bind(id).first<any>();if(!photo)return new Response('התמונה לא נמצאה',{status:404});const obj=await bucket().get(photo.object_key);if(!obj)return new Response('התמונה אינה זמינה',{status:404});return new Response(obj.body,{headers:{'Content-Type':photo.mime_type,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}})}catch(e){return failure(e)}}
