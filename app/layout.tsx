import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Dépenses — votre budget en clair",
  description: "Une application personnelle et sécurisée de gestion de dépenses."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;
}
