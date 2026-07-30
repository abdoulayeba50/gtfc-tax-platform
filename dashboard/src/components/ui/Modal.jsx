"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal generique reutilisable dans toute l'app (formulaires, confirmations,
 * fiches "voir"). Gere la fermeture au clic sur le fond et a la touche
 * Echap, pour ne pas repeter cette logique dans chaque usage.
 */
export default function Modal({ open, onClose, title, children, widthClass = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center">
      <div className="fixed inset-0 bg-neutral-900/50" onClick={onClose} aria-hidden="true" />

      <div className={`relative w-full ${widthClass} rounded-lg bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
