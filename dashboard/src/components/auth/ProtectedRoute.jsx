"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Enveloppe toute page/section qui exige une session valide.
 * Utilise actuellement par le layout du groupe (dashboard) — voir
 * app/(dashboard)/layout.js — donc toutes les pages de ce groupe sont
 * protegees automatiquement, sans avoir a repeter la logique par page.
 *
 * Trois etats geres explicitement pour eviter tout flash de contenu :
 * 1. isLoading  -> on ne sait pas encore s'il y a une session (lecture
 *    localStorage en cours) : on affiche un simple loader.
 * 2. !isAuthenticated -> pas de token : redirection vers /login, on
 *    n'affiche rien pendant ce court instant.
 * 3. isAuthenticated -> on affiche enfin le contenu protege.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" strokeWidth={1.75} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
