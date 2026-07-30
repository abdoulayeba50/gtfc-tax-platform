"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination reutilisable pour tout tableau de l'app. Purement controlee
 * par le parent (page, totalPages, onPageChange) : ce composant ne connait
 * rien des donnees qu'il pagine.
 */
export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-neutral-500">
        Affichage de <span className="font-medium text-neutral-700">{start}</span> à{" "}
        <span className="font-medium text-neutral-700">{end}</span> sur{" "}
        <span className="font-medium text-neutral-700">{totalItems}</span> utilisateurs
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
              n === page
                ? "bg-primary-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
