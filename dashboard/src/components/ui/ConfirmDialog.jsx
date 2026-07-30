"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

/**
 * Confirmation reutilisable pour toute action destructive/sensible
 * (desactiver un utilisateur, supprimer...). Evite un toggle accidentel
 * en un seul clic sur une action a impact.
 */
export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirmer" }) {
  return (
    <Modal open={open} onClose={onClose} title={title} widthClass="max-w-sm">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" strokeWidth={1.75} />
        </div>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>

      <div className="mt-6 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-neutral-300 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
