"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Eye, Pencil, Power, Store as StoreIcon, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { commercesService } from "@/services/commercesService";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import CommerceForm from "@/components/commerces/CommerceForm";
import CommerceDetails from "@/components/commerces/CommerceDetails";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 350;

/**
 * Module Commerces — branche sur l'API reelle (GET/POST/PUT/PATCH
 * /api/commerces). Meme structure que le module Utilisateurs : chargement,
 * recherche debattue, filtres, pagination geres ici ; les composants
 * enfants restent de purs composants d'affichage.
 */
export default function CommercesPage() {
  const [commerces, setCommerces] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [communes, setCommunes] = useState([]);
  const [quartiers, setQuartiers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [secteurFilter, setSecteurFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCommerce, setEditingCommerce] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [viewingCommerce, setViewingCommerce] = useState(null);
  const [commerceToToggle, setCommerceToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCommerces = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await commercesService.list({
        search: debouncedSearch || undefined,
        secteur: secteurFilter !== "all" ? secteurFilter : undefined,
        statut: statutFilter !== "all" ? statutFilter : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setCommerces(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Impossible de charger les commerces.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, secteurFilter, statutFilter, page]);

  useEffect(() => {
    fetchCommerces();
  }, [fetchCommerces]);

  useEffect(() => {
    commercesService
      .getOptions()
      .then((res) => {
        setCommunes(res.data.communes);
        setQuartiers(res.data.quartiers);
        setCategories(res.data.categories);
      })
      .catch(() => {
        // Non bloquant pour l'affichage de la liste.
      });
  }, []);

  function updateSecteurFilter(value) {
    setSecteurFilter(value);
    setPage(1);
  }
  function updateStatutFilter(value) {
    setStatutFilter(value);
    setPage(1);
  }

  function openAddForm() {
    setEditingCommerce(null);
    setFormOpen(true);
  }

  function openEditForm(commerce) {
    setEditingCommerce(commerce);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    setSubmitting(true);
    try {
      if (editingCommerce) {
        await commercesService.update(editingCommerce.id, data);
        setToast({ type: "success", message: "Commerce modifié avec succès." });
      } else {
        await commercesService.create(data);
        setToast({ type: "success", message: "Commerce créé avec succès." });
      }
      setFormOpen(false);
      await fetchCommerces();
    } catch (err) {
      const message = err.response?.data?.message || "Une erreur est survenue.";
      setToast({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmToggleStatut() {
    setToggling(true);
    try {
      const nextStatut = commerceToToggle.statut === "actif" ? "inactif" : "actif";
      await commercesService.updateStatut(commerceToToggle.id, nextStatut);
      setToast({
        type: "success",
        message: nextStatut === "actif" ? "Commerce activé." : "Commerce désactivé.",
      });
      setCommerceToToggle(null);
      await fetchCommerces();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Une erreur est survenue." });
    } finally {
      setToggling(false);
    }
  }

  // Secteurs distincts pour le filtre (a partir des categories chargees,
  // dedupliques par nom puisque potentiellement propres a chaque commune).
  const secteursUniques = Array.from(new Set(categories.map((c) => c.nom))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-neutral-900">Commerces</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Commerces enregistrés sur le terrain par les agents de la commune.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCommerces}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-md bg-primary-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Ajouter un commerce
          </button>
        </div>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom de commerce ou propriétaire..."
            className="w-full rounded-md border border-neutral-300 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <select
          value={secteurFilter}
          onChange={(e) => updateSecteurFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white py-2.5 px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">Tous les secteurs</option>
          {secteursUniques.map((nom) => (
            <option key={nom} value={nom}>
              {nom}
            </option>
          ))}
        </select>

        <select
          value={statutFilter}
          onChange={(e) => updateStatutFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white py-2.5 px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
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
              onClick={fetchCommerces}
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
                    <Th>Commerce</Th>
                    <Th>Téléphone</Th>
                    <Th>Secteur</Th>
                    <Th>Quartier</Th>
                    <Th>Statut</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" strokeWidth={1.75} />
                      </td>
                    </tr>
                  ) : commerces.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <StoreIcon className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                        <p className="mt-3 text-sm text-neutral-500">Aucun commerce ne correspond à ces critères.</p>
                      </td>
                    </tr>
                  ) : (
                    commerces.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100">
                              <StoreIcon className="h-4 w-4 text-primary-700" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-neutral-900">{c.nom_commerce}</p>
                              <p className="truncate text-xs text-neutral-500">{c.nom_proprietaire}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{c.telephone || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge tone="neutral">{c.secteur}</Badge>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{c.quartier}</td>
                        <td className="px-4 py-3">
                          <Badge tone={c.statut === "actif" ? "green" : "red"}>
                            {c.statut === "actif" ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <ActionButton label="Voir" onClick={() => setViewingCommerce(c)} icon={Eye} />
                            <ActionButton label="Modifier" onClick={() => openEditForm(c)} icon={Pencil} />
                            <ActionButton
                              label={c.statut === "actif" ? "Désactiver" : "Activer"}
                              onClick={() => setCommerceToToggle(c)}
                              icon={Power}
                              danger={c.statut === "actif"}
                            />
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

      {/* Modal Ajouter / Modifier */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingCommerce ? "Modifier le commerce" : "Ajouter un commerce"}
        widthClass="max-w-2xl"
      >
        <CommerceForm
          initialData={editingCommerce}
          communes={communes}
          quartiers={quartiers}
          categories={categories}
          submitting={submitting}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Modal Voir */}
      <Modal open={Boolean(viewingCommerce)} onClose={() => setViewingCommerce(null)} title="Fiche commerce" widthClass="max-w-xl">
        {viewingCommerce && <CommerceDetails commerce={viewingCommerce} />}
      </Modal>

      {/* Confirmation Activer / Désactiver */}
      <ConfirmDialog
        open={Boolean(commerceToToggle)}
        onClose={() => setCommerceToToggle(null)}
        onConfirm={confirmToggleStatut}
        title={commerceToToggle?.statut === "actif" ? "Désactiver le commerce" : "Activer le commerce"}
        description={
          commerceToToggle
            ? `${commerceToToggle.statut === "actif" ? "Désactiver" : "Activer"} le commerce "${commerceToToggle.nom_commerce}" ?`
            : ""
        }
        confirmLabel={toggling ? "..." : commerceToToggle?.statut === "actif" ? "Désactiver" : "Activer"}
      />

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

function ActionButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 ${
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:text-neutral-700"
      }`}
    >
      <Icon className="h-[16px] w-[16px]" strokeWidth={1.75} />
    </button>
  );
}
