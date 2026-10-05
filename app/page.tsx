import FamilyApp from '@/components/family-app';
import {requireFamilySession} from '@/lib/session';
export const dynamic='force-dynamic';
export default async function Page(){await requireFamilySession('/');return <FamilyApp/>}
