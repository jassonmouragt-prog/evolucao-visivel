import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Evolução Visível", template: "%s · Evolução Visível" }, description: "Acompanhe cada aula. Registre cada avanço. Mostre a evolução.", icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" }, robots: { index: false, follow: false } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
