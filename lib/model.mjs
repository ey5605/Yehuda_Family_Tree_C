export const uid=()=>crypto.randomUUID();
export const clone=x=>structuredClone(x);
export const emptyTree=()=>({schemaVersion:'1.0',format:'family-tree-generic',title:'אילן היוחסין של משפחת יהודה',language:'he',direction:'rtl',metadata:{},persons:[],families:[],relationships:[],reviewItems:[],confirmations:[],descendantSummaries:[]});
const months=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
export function parseDate(input){
 if(input==null||input==='')return null;
 let y,m,d,approximate=false,extras={};
 if(typeof input==='object'){
  extras=input; approximate=!!(input.approximate||input.isApproximate);
  if(input.value&&!input.year){const v=parseDate(input.value);return {...input,...v,approximate:approximate||v?.approximate};}
  y=Number(input.year);m=input.month==null?undefined:Number(input.month);d=input.day==null?undefined:Number(input.day);
 }else{
  let s=String(input).trim();approximate=/^(בערך|כ־|כ-|~|circa|c\.)/i.test(s);s=s.replace(/^(בערך|כ־|כ-|~|circa|c\.)\s*/i,'');
  let a;if((a=s.match(/^(\d{1,2})\s+ב?([^\s]+)\s+(\d{4})$/))&&months.includes(a[2])){d=+a[1];m=months.indexOf(a[2])+1;y=+a[3]}
  else if((a=s.match(/^ב?([^\s]+)\s+(\d{4})$/))&&months.includes(a[1])){m=months.indexOf(a[1])+1;y=+a[2]}
  else if((a=s.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/))){y=+a[1];m=a[2]?+a[2]:undefined;d=a[3]?+a[3]:undefined}
  else if((a=s.match(/^(?:(\d{1,2})[./])?(\d{1,2})[./](\d{4})$/))){d=a[1]?+a[1]:undefined;m=+a[2];y=+a[3]}
  else throw Error('תאריך לא תקין. אפשר להזין שנה, חודש ושנה או יום.חודש.שנה.');
 }
 if(!Number.isInteger(y)||y<1||y>9999||m!==undefined&&(!Number.isInteger(m)||m<1||m>12)||d!==undefined&&(!m||!Number.isInteger(d)||d<1||d>new Date(Date.UTC(y===1?2001:y,m,0)).getUTCDate()))throw Error('תאריך לא תקין: '+JSON.stringify(input));
 return {...extras,year:y,...(m?{month:m}:{}),...(d?{day:d}:{}),precision:d?'day':m?'month':'year',approximate};
}
export function dateText(v){if(v==null||v==='')return '';try{const d=parseDate(v);return (d.approximate?'בערך ':'')+(d.day?`${d.day} ב${months[d.month-1]} ${d.year}`:d.month?`${months[d.month-1]} ${d.year}`:String(d.year))}catch{return String(v)}}
export function dateInput(v){if(!v)return '';try{const d=parseDate(v);return (d.approximate?'בערך ':'')+(d.day?`${String(d.day).padStart(2,'0')}.`: '')+(d.month?`${String(d.month).padStart(2,'0')}.`:'')+d.year}catch{return String(v)}}
export function dateBounds(v){const d=parseDate(v);if(!d)return null;return [d.year*10000+(d.month||1)*100+(d.day||1),d.year*10000+(d.month||12)*100+(d.day||31)]}
export const name=p=>p.fullName??p.displayName??'?';
export const parentEdges=t=>t.relationships.filter(r=>typeof r.parentId==='string'&&typeof r.childId==='string');
const key=(a,b)=>JSON.stringify([a,b]);
const list=x=>Array.isArray(x)?x:[];
export function topological(t){
 const deg=new Map(t.persons.map(p=>[p.id,0])),children=new Map(t.persons.map(p=>[p.id,[]]));
 for(const r of parentEdges(t)){if(!deg.has(r.parentId)||!deg.has(r.childId))continue;deg.set(r.childId,deg.get(r.childId)+1);children.get(r.parentId).push(r.childId)}
 const q=[...deg].filter(([,n])=>n===0).map(([id])=>id),rank=new Map(q.map(id=>[id,0]));
 for(let i=0;i<q.length;i++)for(const c of children.get(q[i])){rank.set(c,Math.max(rank.get(c)||0,(rank.get(q[i])||0)+1));deg.set(c,deg.get(c)-1);if(deg.get(c)===0)q.push(c)}
 return {order:q,rank,children,cycles:[...deg].filter(([,n])=>n>0).map(([id])=>id)};
}
export function canonicalize(input){
 const t=clone(input);t.persons=list(t.persons);t.families=list(t.families);t.relationships=list(t.relationships);
 const ps=new Map(t.persons.map(p=>[p.id,p]));for(const p of t.persons){p.parentIds=[];p.childIds=[];p.partnerIds=[]}
 for(const r of parentEdges(t)){const a=ps.get(r.parentId),b=ps.get(r.childId);if(a&&b){if(!a.childIds.includes(b.id))a.childIds.push(b.id);if(!b.parentIds.includes(a.id))b.parentIds.push(a.id)}}
 for(const f of t.families){f.partnerIds=[...new Set(list(f.partnerIds))].filter(id=>ps.has(id));f.childIds=[...new Set(list(f.childIds))].filter(c=>(!f.partnerIds.length||f.partnerIds.every(p=>ps.get(p).childIds.includes(c))));for(const a of f.partnerIds)for(const b of f.partnerIds)if(a!==b&&!ps.get(a).partnerIds.includes(b))ps.get(a).partnerIds.push(b)}
 for(const r of parentEdges(t)){if(r.familyId){const f=t.families.find(f=>f.id===r.familyId);if(!f||!f.partnerIds.includes(r.parentId)||!f.childIds.includes(r.childId))delete r.familyId}}
 for(const p of t.persons){const order=new Map(list(p.childOrder).map((id,i)=>[id,i]));p.childIds.sort((a,b)=>{if(order.has(a)||order.has(b))return (order.get(a)??Infinity)-(order.get(b)??Infinity);let da,db;try{da=dateBounds(ps.get(a)?.birthDate)?.[0];db=dateBounds(ps.get(b)?.birthDate)?.[0]}catch{}return (da??Infinity)-(db??Infinity)});if(p.childOrder)p.childOrder=p.childOrder.filter(id=>p.childIds.includes(id))}
 return t;
}
export function inspectImport(input,resolutions={}){
 const errors=[],warnings=[],conflicts=[];let t;
 const fail=s=>errors.push(s);
 try{t=clone(input)}catch{return {errors:['מבנה הנתונים אינו נתמך'],warnings,conflicts,tree:emptyTree()}}
 if(!t||typeof t!=='object'||!Array.isArray(t.persons)){return {errors:['נדרשת רשימת persons בקובץ JSON'],warnings,conflicts,tree:emptyTree()}}
 for(const c of ['families','relationships','reviewItems','confirmations','descendantSummaries']){if(t[c]!=null&&!Array.isArray(t[c]))fail(`${c}: נדרשת רשימה`);t[c]=list(t[c])}
 t={...emptyTree(),...t};
 const maps={};for(const c of ['persons','families','relationships']){maps[c]=new Map();for(const o of t[c]){if(!o||typeof o!=='object'){fail(`${c}: רשומה לא תקינה`);continue}if(typeof o.id!=='string'||!o.id.trim())fail(`${c}: חסר מזהה תקין`);else if(maps[c].has(o.id))fail(`${c}: מזהה כפול ${o.id}`);else maps[c].set(o.id,o)}}
 const ps=maps.persons,fs=maps.families;const label=id=>`${name(ps.get(id)||{})} [${id}]`;
 const ref=(id,where)=>{if(!ps.has(id))fail(`${where}: הפניה לאדם שאינו קיים [${id}]`)};
 for(const p of t.persons){if(!p||typeof p!=='object')continue;if(typeof (p.fullName??p.displayName)!=='string'||!(p.fullName??p.displayName).trim())fail(`לאדם ${p.id} חסר שם מלא`);
  for(const f of ['parentIds','childIds','partnerIds']){if(p[f]!=null&&!Array.isArray(p[f]))fail(`${label(p.id)}: ${f} חייב להיות רשימה`);for(const id of list(p[f]))ref(id,`${label(p.id)} / ${f}`)}
  for(const f of ['birthDate','deathDate'])try{parseDate(p[f])}catch(e){fail(`${label(p.id)}: ${f}: ${e.message}`)}
  try{const b=dateBounds(p.birthDate),d=dateBounds(p.deathDate);if(b&&d&&d[1]<b[0])warnings.push(`${label(p.id)}: תאריך הפטירה קודם ללידה — יש לבדוק`)}catch{}
  if(p.photo&&typeof p.photo==='object'&&p.photo.data&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(p.photo.data))fail(`${label(p.id)}: תמונה מוטמעת אינה PNG, JPEG או WebP תקינה`);
 }
 const edges=new Map(),pairs=new Map();
 const add=(a,b,source,raw={})=>{ref(a,source);ref(b,source);if(a===b)fail(`הורות עצמית: ${label(a)}`);const k=key(a,b);if(!edges.has(k))edges.set(k,{a,b,records:[],sources:[]});const e=edges.get(k);e.sources.push(source);e.records.push(raw)};
 const partner=(a,b,source)=>{ref(a,source);ref(b,source);if(a===b)fail(`זוגיות עצמית: ${label(a)}`);pairs.set(key(...[a,b].sort()),{a,b,source})};
 for(const r of t.relationships){if(!r||typeof r!=='object')continue;if(r.familyId&&!fs.has(r.familyId))fail(`קשר [${r.id}]: משפחה [${r.familyId}] אינה קיימת`);if(r.parentId!=null||r.childId!=null){add(r.parentId,r.childId,`relationships [${r.id}]`,r);if(r.familyId&&fs.has(r.familyId)){const f=fs.get(r.familyId);if(Array.isArray(f.partnerIds)&&!f.partnerIds.includes(r.parentId)||Array.isArray(f.childIds)&&!f.childIds.includes(r.childId)){const id='family:'+r.id;conflicts.push({id,label:`קשר ${r.id} אינו תואם ליחידה ${r.familyId}`,choices:['detach']});if(resolutions[id]==='detach')delete r.familyId}}}}
 for(const p of t.persons){if(!p?.id)continue;for(const a of list(p.parentIds))add(a,p.id,`persons [${p.id}].parentIds`);for(const b of list(p.childIds))add(p.id,b,`persons [${p.id}].childIds`);for(const b of list(p.partnerIds))partner(p.id,b,`persons [${p.id}].partnerIds`)}
 for(const f of t.families){if(!f?.id)continue;for(const field of ['partnerIds','childIds']){if(f[field]!=null&&!Array.isArray(f[field]))fail(`משפחה ${f.id}: ${field} חייב להיות רשימה`);for(const id of list(f[field]))ref(id,`משפחה [${f.id}]`)}
  for(let i=0;i<list(f.partnerIds).length;i++)for(let j=i+1;j<f.partnerIds.length;j++)partner(f.partnerIds[i],f.partnerIds[j],`families [${f.id}]`);
  for(const a of list(f.partnerIds))for(const b of list(f.childIds))add(a,b,`families [${f.id}]`,{familyId:f.id,...(f.parentageType?{parentageType:f.parentageType}:{})});
 }
 const rs=t.relationships.filter(r=>r&&r.parentId==null&&r.childId==null);
 for(const [k,e] of edges){
  const a=ps.get(e.a),b=ps.get(e.b),denied=[];
  if(Array.isArray(a?.childIds)&&!a.childIds.includes(e.b))denied.push(`${e.a}.childIds`);
  if(Array.isArray(b?.parentIds)&&!b.parentIds.includes(e.a))denied.push(`${e.b}.parentIds`);
  if(denied.length){const id='edge:'+k;conflicts.push({id,label:`${label(e.a)} ← ${label(e.b)}: הקשר מופיע ב־${e.sources.join(', ')} וחסר ברשימה מפורשת ${denied.join(', ')}`,choices:['include','exclude']});if(resolutions[id]==='exclude')continue}
  const types=[...new Set(e.records.map(x=>x.parentageType).filter(Boolean))];const ti='type:'+k;if(types.length>1)conflicts.push({id:ti,label:`סוג הורות סותר: ${label(e.a)} ← ${label(e.b)}`,choices:types});
  const originals=e.records.filter(x=>x.id);let r=Object.assign({},...e.records.slice().reverse());r={...r,id:originals[0]?.id||uid(),type:originals[0]?.type||'parent-child',parentId:e.a,childId:e.b,parentageType:resolutions[ti]||types[0]||'unspecified'};
  if(originals.length>1)r.mergedRepresentations=originals.slice(1);
  if(r.familyId&&resolutions['family:'+r.id]==='detach')delete r.familyId;
  rs.push(r);
 }
 for(const [k,e] of pairs){const a=ps.get(e.a),b=ps.get(e.b);const id='partner:'+k;
  if(Array.isArray(a?.partnerIds)&&!a.partnerIds.includes(e.b)||Array.isArray(b?.partnerIds)&&!b.partnerIds.includes(e.a)){conflicts.push({id,label:`זוגיות סותרת: ${label(e.a)} ו־${label(e.b)}`,choices:['include','exclude']});if(resolutions[id]==='exclude'){for(const f of t.families)if(list(f.partnerIds).includes(e.a)&&list(f.partnerIds).includes(e.b)){f.partnerIds=f.partnerIds.filter(x=>x!==e.b)}continue}}
  if(!t.families.some(f=>list(f.partnerIds).includes(e.a)&&list(f.partnerIds).includes(e.b)))t.families.push({id:uid(),partnerIds:[e.a,e.b],childIds:[]});
 }
 t.relationships=rs;
 if(!errors.length){const g=topological(t);if(g.cycles.length)fail(`מעגל הורות כולל את: ${g.cycles.map(label).join(', ')}`)}
 if(errors.length)return {tree:emptyTree(),errors:[...new Set(errors)],warnings,conflicts:[],allConflicts:[],stats:{persons:t.persons.length,families:t.families.length,relationships:rs.length}};
 t=canonicalize(t);
 return {tree:t,errors:[...new Set(errors)],warnings:[...new Set(warnings)],conflicts:conflicts.filter(c=>!c.choices.includes(resolutions[c.id])),allConflicts:conflicts,stats:{persons:t.persons.length,families:t.families.length,relationships:parentEdges(t).length}};
}
export function addParent(input,parentId,childId,options={}){
 const t=clone(input);if(parentId===childId)throw Error('אדם לא יכול להיות הורה של עצמו');if(!t.persons.some(p=>p.id===parentId)||!t.persons.some(p=>p.id===childId))throw Error('אדם אינו קיים');
 const old=parentEdges(t).find(r=>r.parentId===parentId&&r.childId===childId);if(old)Object.assign(old,options);else t.relationships.push({id:uid(),type:'parent-child',parentId,childId,parentageType:'unspecified',...options});
 if(topological(t).cycles.length)throw Error('הקשר יוצר מעגל הורות ולכן לא נשמר');
 if(options.familyId){const f=t.families.find(f=>f.id===options.familyId);if(!f||!f.partnerIds.includes(parentId))throw Error('ההורה אינו שייך ליחידה המשפחתית שנבחרה');if(!f.childIds.includes(childId))f.childIds.push(childId);for(const p of f.partnerIds)if(p!==parentId&&!parentEdges(t).some(r=>r.parentId===p&&r.childId===childId))t.relationships.push({id:uid(),type:'parent-child',parentId:p,childId,familyId:f.id,parentageType:options.parentageType||'unspecified'});if(topological(t).cycles.length)throw Error('היחידה המשפחתית יוצרת מעגל הורות')}
 return canonicalize(t);
}
export function addPartner(input,a,b){const t=clone(input);if(a===b)throw Error('לא ניתן ליצור זוגיות עצמית');if(!t.persons.some(p=>p.id===a)||!t.persons.some(p=>p.id===b))throw Error('אדם אינו קיים');if(!t.families.some(f=>f.partnerIds.includes(a)&&f.partnerIds.includes(b)))t.families.push({id:uid(),partnerIds:[a,b],childIds:[]});return canonicalize(t)}
export function deletePerson(input,id){const t=clone(input);t.persons=t.persons.filter(p=>p.id!==id);t.relationships=t.relationships.filter(r=>r.parentId!==id&&r.childId!==id);for(const f of t.families){f.partnerIds=f.partnerIds.filter(x=>x!==id);f.childIds=f.childIds.filter(x=>x!==id)}return canonicalize(t)}
export function exportTree(input,full=false){const t=canonicalize(input);t.schemaVersion=t.schemaVersion||'1.0';t.format=t.format||'family-tree-generic';t.metadata={...t.metadata,exportedAt:new Date().toISOString(),statistics:{persons:t.persons.length,families:t.families.length,parentRelationships:parentEdges(t).length},backupMode:full?'full':'data-only',extensions:{...t.metadata?.extensions,partialDates:'{year, month?, day?, precision: year|month|day, approximate}; strings preserved',photos:'photo: {id, mimeType, fileName, url?, data?: data:image/...;base64,...}',childOrder:'person.childOrder: ordered person IDs'}};if(!full)for(const p of t.persons)if(p.photo&&typeof p.photo==='object')delete p.photo.data;return t}
export function renameIncoming(input,oldId,newId){const t=clone(input);if(t.persons.some(p=>p.id===newId))throw Error('המזהה החדש כבר קיים');for(const p of t.persons){if(p.id===oldId)p.id=newId;for(const f of ['parentIds','childIds','partnerIds','childOrder'])if(Array.isArray(p[f]))p[f]=p[f].map(x=>x===oldId?newId:x)}for(const f of t.families)for(const k of ['partnerIds','childIds','childOrder'])if(Array.isArray(f[k]))f[k]=f[k].map(x=>x===oldId?newId:x);for(const r of t.relationships)for(const k of ['parentId','childId'])if(r[k]===oldId)r[k]=newId;const remap=x=>{if(!x||typeof x!=='object')return;for(const k of Object.keys(x)){if((k==='personId'||k==='parentId'||k==='childId')&&x[k]===oldId)x[k]=newId;else if(/Ids$/.test(k)&&Array.isArray(x[k]))x[k]=x[k].map(v=>v===oldId?newId:v);else remap(x[k])}};for(const k of ['reviewItems','confirmations','descendantSummaries'])remap(t[k]);return t}
export function mergeTrees(existing,incoming,choices={}){
 let inc=clone(incoming);const conflicts=[];
 for(const p of inc.persons){const choice=choices['persons:'+p.id];if(choice?.startsWith('rename:'))inc=renameIncoming(inc,p.id,choice.slice(7))}
 const t={...clone(existing)};
 for(const collection of ['persons','families','relationships']){const map=new Map(t[collection].map(x=>[x.id,x]));for(const x of inc[collection]){const old=map.get(x.id);const k=collection+':'+x.id;const strip=o=>{const q=clone(o);if(collection==='persons')for(const f of ['parentIds','childIds','partnerIds'])delete q[f];return q};if(old&&JSON.stringify(strip(old))!==JSON.stringify(strip(x))){if(!['existing','incoming'].includes(choices[k]))conflicts.push({id:k,collection,existing:old,incoming:x,label:`${collection} [${x.id}]: ${x.fullName||x.id}`});if(choices[k]==='incoming')map.set(x.id,x)}else if(!old)map.set(x.id,x)}t[collection]=[...map.values()]}
 for(const k of ['reviewItems','confirmations','descendantSummaries'])t[k]=[...new Map([...list(t[k]),...list(inc[k])].map(x=>[JSON.stringify(x),x])).values()];
 t.metadata={...t.metadata,mergedSources:[...list(t.metadata?.mergedSources),{metadata:inc.metadata,title:inc.title}]};
 t.importedExtensions=[...list(t.importedExtensions),Object.fromEntries(Object.entries(inc).filter(([k])=>!['persons','families','relationships','reviewItems','confirmations','descendantSummaries'].includes(k)))];
 for(const p of t.persons)for(const field of ['parentIds','childIds','partnerIds'])delete p[field];
 const checked=inspectImport(t,choices);return {tree:checked.tree,conflicts,errors:checked.errors,relationshipConflicts:checked.conflicts,allRelationshipConflicts:checked.allConflicts};
}

