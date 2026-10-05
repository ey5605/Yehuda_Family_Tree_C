import {database,bucket} from '@/db';
import {access,failure,sameOrigin} from '@/lib/access';
import {emptyTree,inspectImport,exportTree} from '@/lib/model.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{const {user,role,state}=await access();let tree=emptyTree();if(state.object_key){const obj=await bucket().get(state.object_key);if(!obj)throw Error('לא ניתן לטעון את העץ השמור');tree=await obj.json()}return Response.json({tree,revision:state.revision,role,user:{id:user.userId,email:user.email}},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function PUT(req:Request){try{sameOrigin(req);const {state}=await access(true);const body:any=await req.json();if(body.revision!==state.revision)return Response.json({error:'העץ עודכן במכשיר אחר. יש לטעון את הגרסה העדכנית ולמזג את השינויים.',conflict:true},{status:409});const checked=inspectImport(body.tree);if(checked.errors.length||checked.conflicts.length)return Response.json({error:'הנתונים לא נשמרו: '+[...checked.errors,...checked.conflicts.map((c:any)=>c.label)].join('; ')},{status:422});
const data=exportTree(checked.tree,true);for(const p of data.persons)if(p.photo?.data)return Response.json({error:'יש להעלות את התמונות לפני שמירת העץ'},{status:422});
const objectKey='versions/'+crypto.randomUUID()+'.json';await bucket().put(objectKey,JSON.stringify(data),{httpMetadata:{contentType:'application/json; charset=utf-8'}});
const result=await database().prepare('UPDATE tree_state SET revision = revision + 1, object_key = ?, updated_at = ? WHERE id = ? AND revision = ?').bind(objectKey,new Date().toISOString(),'family',body.revision).run();if(result.meta.changes!==1)return Response.json({error:'העץ עודכן במקביל; השינויים שלך נשמרו במכשיר.',conflict:true},{status:409});return Response.json({revision:body.revision+1,tree:data},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}

