"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Eye, Receipt, RefreshCw, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { creancesService } from "@/services/creancesService";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import CreanceDetails from "@/components/creances/CreanceDetails";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 350;

const STATUT_LABELS = {
  en_attente: "En attente",
  partiellement_payee: "Partiellement payée",
  payee: "Payée",
  annulee: "Annulée",
};

const STATUT_TONES = {
  en_attente: "neutral",
  partiellement_payee: "neutral",
  payee: "green",
  annulee: "red",
};

/**
 * Module Creances — FRONTEND branche sur l'API reelle.
 * Contrairement a Utilisateurs/Commerces/Taxes, il n'y a volontairement PAS
 * de bouton Ajouter/Modifier ici : seuls "Générer les créances" et "Voir"
 * sont demandes. La creation manuelle et la modification restent possibles
 * cote API (POST/PUT /api/creances) pour un futur usage, mais ne sont pas
 * exposees dans cette interface.
 */
export default function CreancesPage() {
  const [creances, setCreances] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [commerces, setCommerces] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [commerceFilter, setCommerceFilter] = useState("all");
  const [periodeFilter, setPeriodeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [viewingCreance, setViewingCreance] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCreances = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await creancesService.list({
        search: debouncedSearch || undefined,
        statut: statutFilter !== "all" ? statutFilter : undefined,
        commerce_id: commerceFilter !== "all" ? commerceFilter : undefined,
        periode: periodeFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setCreances(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Impossible de charger les créances.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statutFilter, commerceFilter, periodeFilter, page]);

  useEffect(() => {
    fetchCreances();
  }, [fetchCreances]);

  useEffect(() => {
    creancesService
      .getOptions()
      .then((res) => setCommerces(res.data.commerces))
      .catch(() => {});
  }, []);

  function updateStatutFilter(value) {
    setStatutFilter(value);
    setPage(1);
  }
  function updateCommerceFilter(value) {
    setCommerceFilter(value);
    setPage(1);
  }
  function updatePeriodeFilter(value) {
    setPeriodeFilter(value);
    setPage(1);
  }

  async function handleGenerer() {
    setGenerating(true);
    try {
      const res = await creancesService.generer();
      setToast({ type: "success", message: res.message });
      await fetchCreances();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Une erreur est survenue." });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-neutral-900">Créances</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Sommes dues par les commerces, générées automatiquement à partir des taxes actives.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCreances}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={handleGenerer}
            disabled={generating}
            className="flex items-center justify-center gap-2 rounded-md bg-primary-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            )}
            Générer les créances
          </button>
        </div>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numéro ou commerce..."
            className="w-full rounded-md border border-neutral-300 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <select
          value={commerceFilter}
          onChange={(e) => updateCommerceFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white py-2.5 px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">Tous les commerces</option>
          {commerces.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom_commerce}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={periodeFilter}
          onChange={(e) => updatePeriodeFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white py-2.5 px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />

        <select
          value={statutFilter}
          onChange={(e) => updateStatutFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white py-2.5 px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {loadError ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-neutral-700">{loadError}</p>
            <button
              type="button"
              onClick={fetchCreances}
              className="mt-4 rounded-md border border-neutral-300 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <Th>Numéro</Th>
                    <Th>Commerce</Th>
                    <Th>Taxe</Th>
                    <Th>Montant</Th>
                    <Th>Échéance</Th>
                    <Th>Statut</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" strokeWidth={1.75} />
                      </td>
                    </tr>
                  ) : creances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <Receipt className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                        <p className="mt-3 text-sm text-neutral-500">
                          Aucune créance. Clique sur "Générer les créances" pour créer celles dues sur la période en cours.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    creances.map((cr) => (
                      <tr key={cr.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-mono text-xs text-neutral-700">{cr.numero}</td>
                        <td className="px-4 py-3">
                          <p className="text-neutral-900">{cr.commerce}</p>
                          <p className="text-xs text-neutral-500">{cr.commerce_proprietaire}</p>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{cr.taxe}</td>
                        <td className="px-4 py-3 text-neutral-600">
                          {Number(cr.montant).toLocaleString("fr-FR")} {cr.devise}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {new Date(cr.date_echeance).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUT_TONES[cr.statut] ?? "neutral"}>
                            {STATUT_LABELS[cr.statut] ?? cr.statut}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <ActionButton label="Voir" onClick={() => setViewingCreance(cr)} icon={Eye} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Modal Voir */}
      <Modal open={Boolean(viewingCreance)} onClose={() => setViewingCreance(null)} title="Détails de la créance" widthClass="max-w-xl">
        {viewingCreance && <CreanceDetails creance={viewingCreance} />}
      </Modal>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 ${className}`}>
      {children}
    </th>
  );
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
    >
      <Icon className="h-[16px] w-[16px]" strokeWidth={1.75} />
    </button>
  );
}
