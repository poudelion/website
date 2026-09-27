import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Aditya Raj Poudel — The Home Ground", description: "My portfolio, on the pitch.", icons: { icon: "/pngs/favicon.ico" } };
export const viewport: Viewport = { themeColor: "#102635", width: "device-width", initialScale: 1 };
export default function RootLayout({children}: {children: React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
