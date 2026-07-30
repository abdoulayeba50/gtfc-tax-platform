"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

/**
 * Notification flottante reutilisable (succes/erreur), auto-masquee apres
 * un delai. Pilotee entierement par le parent : { message, type } ou null.
 */
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white p-4 shadow-lg"
      style={{ borderColor: isError ? "#fecaca" : "var(--color-primary-200)" }}
    >
      {isError ? (
        <XCircle className="h-5 w-5 shrink-0 text-red-600" strokeWidth={1.75} />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.75} />
      )}
      <p className="flex-1 text-sm text-neutral-700">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-neutral-400 hover:text-neutral-600"
        aria-label="Fermer la notification"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
