import type { Metadata } from "next";
import CampNou from "@/components/camp-nou/CampNou";
export const metadata: Metadata = { title: "Aditya Raj Poudel — The Home Ground", description: "An interactive portfolio inside a reimagined, completed Camp Nou. Step onto the pitch and explore." };
export default function Home() { return <CampNou />; }
