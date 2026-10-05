import { env } from 'cloudflare:workers';
export function database(){if(!env.DB)throw Error('מסד הנתונים אינו זמין');return env.DB}
export function bucket(){if(!env.BUCKET)throw Error('אחסון הקבצים אינו זמין');return env.BUCKET}
