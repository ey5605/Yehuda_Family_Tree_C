import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'אילן היוחסין של משפחת יהודה',description:'הסיפור שלנו, מדור לדור. עץ המשפחה הפרטי של משפחת יהודה.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="he" dir="rtl"><body>{children}</body></html>}
