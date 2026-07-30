import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

/*
 * Polices systeme plutot que next/font/google : pas de dependance a un
 * telechargement externe au moment du build (plus robuste sur un reseau
 * d'entreprise/mairie restreint), et un rendu quasi identique puisque
 * chaque OS fournit deja une police sans-serif moderne de qualite.
 * Les deux piles sont definies dans globals.css (--font-inter / --font-source-serif).
 */

export const metadata = {
  title: "GTFC Tax Platform",
  description: "Plateforme de digitalisation de la collecte des taxes locales — Commune de Gueule Tapée-Fass-Colobane",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {/* AuthProvider au niveau racine : /login en a besoin (pour login())
            tout comme le groupe (dashboard) (pour ProtectedRoute + Header). */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
