"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Eye, Pencil, Power, Receipt, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { taxesService } from "@/services/taxesService";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import TaxeForm from "@/components/taxes/TaxeForm";
import TaxeDetails from "@/components/taxes/TaxeDetails";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 350;

const FREQUENCE_LABELS = {
  journaliere: "Journalière",
  hebdomadaire: "Hebdomadaire",
  mensuelle: "Mensuelle",
  trimestrielle: "Trimestrielle",
  annuelle: "Annuelle",
};

/**
 * Module Taxes — meme structure que Utilisateurs/Commerces : chargement,
 * recherche debattue, filtres, pagination geres ici ; composants enfants
 * de purs composants d'affichage.
 */
export default function TaxesPage() {
  const [taxes, setTaxes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [commerces, setCommerces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [frequences, setFrequences] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("all");
  const [frequenceFilter, setFrequenceFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTaxe, setEditingTaxe] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [viewingTaxe, setViewingTaxe] = useState(null);
  const [taxeToToggle, setTaxeToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await taxesService.list({
        search: debouncedSearch || undefined,
        categorie: categorieFilter !== "all" ? categorieFilter : undefined,
        frequence: frequenceFilter !== "all" ? frequenceFilter : undefined,
        statut: statutFilter !== "all" ? statutFilter : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setTaxes(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Impossible de charger les taxes.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categorieFilter, frequenceFilter, statutFilter, page]);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  useEffect(() => {
    taxesService
      .getOptions()
      .then((res) => {
        setCommerces(res.data.commerces);
        setCategories(res.data.categories);
        setFrequences(res.data.frequences);
      })
      .catch(() => {});
  }, []);

  function updateCategorieFilter(value) {
    setCategorieFilter(value);
    setPage(1);
  }
  function updateFrequenceFilter(value) {
    setFrequenceFilter(value);
    setPage(1);
  }
  function updateStatutFilter(value) {
    setStatutFilter(value);
    setPage(1);
  }

  function openAddForm() {
    setEditingTaxe(null);
    setFormOpen(true);
  }

  function openEditForm(taxe) {
    setEditingTaxe(taxe);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    setSubmitting(true);
    try {
      if (editingTaxe) {
        await taxesService.update(editingTaxe.id, data);
        setToast({ type: "success", message: "Taxe modifiée avec succès." });
      } else {
        await taxesService.create(data);
        setToast({ type: "success", message: "Taxe créée avec succès." });
      }
      setFormOpen(false);
      await fetchTaxes();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Une erreur est survenue." });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmToggleStatut() {
    setToggling(true);
    try {
      const nextActif = !taxeToToggle.actif;
      await taxesService.updateStatut(taxeToToggle.id, nextActif);
      setToast({ type: "success", message: nextActif ? "Taxe activée." : "Taxe désactivée." });
      setTaxeToToggle(null);
      await fetchTaxes();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Une erreur est survenue." });
    } finally {
      setToggling(false);
    }
  }

  const categoriesUniques = Array.from(new Set(categories.map((c) => c.nom))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-neutral-900">Taxes</h2>
          <p className="mt-1 text-sm text-neutral-500">Taxes appliquées aux commerces enregistrés.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTaxes}
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
            Ajouter une taxe
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
            placeholder="Rechercher par nom de taxe ou commerce..."
            className="w-full rounded-md border border-neutral-300 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <select
          value={categorieFilter}
          onChange={(e) => updateCategorieFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white py-2.5 px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">Toutes les catégories</option>
          {categoriesUniques.map((nom) => (
            <option key={nom} value={nom}>
              {nom}
            </option>
          ))}
        </select>

        <select
          value={frequenceFilter}
          onChange={(e) => updateFrequenceFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white py-2.5 px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">Toutes les fréquences</option>
          {frequences.map((f) => (
            <option key={f} value={f}>
              {FREQUENCE_LABELS[f] ?? f}
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
              onClick={fetchTaxes}
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
                    <Th>Taxe</Th>
                    <Th>Commerce</Th>
                    <Th>Montant</Th>
                    <Th>Fréquence</Th>
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
                  ) : taxes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <Receipt className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                        <p className="mt-3 text-sm text-neutral-500">Aucune taxe ne correspond à ces critères.</p>
                      </td>
                    </tr>
                  ) : (
                    taxes.map((t) => (
                      <tr key={t.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-900">{t.nom}</p>
                          <Badge tone="neutral">{t.categorie}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-neutral-900">{t.commerce}</p>
                          <p className="text-xs text-neutral-500">{t.commerce_proprietaire}</p>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {Number(t.montant).toLocaleString("fr-FR")} {t.devise}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{FREQUENCE_LABELS[t.frequence] ?? t.frequence}</td>
                        <td className="px-4 py-3">
                          <Badge tone={t.actif ? "green" : "red"}>{t.actif ? "Actif" : "Inactif"}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <ActionButton label="Voir" onClick={() => setViewingTaxe(t)} icon={Eye} />
                            <ActionButton label="Modifier" onClick={() => openEditForm(t)} icon={Pencil} />
                            <ActionButton
                              label={t.actif ? "Désactiver" : "Activer"}
                              onClick={() => setTaxeToToggle(t)}
                              icon={Power}
                              danger={t.actif}
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
        title={editingTaxe ? "Modifier la taxe" : "Ajouter une taxe"}
        widthClass="max-w-xl"
      >
        <TaxeForm
          initialData={editingTaxe}
          commerces={commerces}
          categories={categories}
          frequences={frequences}
          submitting={submitting}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Modal Voir */}
      <Modal open={Boolean(viewingTaxe)} onClose={() => setViewingTaxe(null)} title="Détails de la taxe" widthClass="max-w-xl">
        {viewingTaxe && <TaxeDetails taxe={viewingTaxe} />}
      </Modal>

      {/* Confirmation Activer / Désactiver */}
      <ConfirmDialog
        open={Boolean(taxeToToggle)}
        onClose={() => setTaxeToToggle(null)}
        onConfirm={confirmToggleStatut}
        title={taxeToToggle?.actif ? "Désactiver la taxe" : "Activer la taxe"}
        description={
          taxeToToggle
            ? `${taxeToToggle.actif ? "Désactiver" : "Activer"} la taxe "${taxeToToggle.nom}" pour ${taxeToToggle.commerce} ?`
            : ""
        }
        confirmLabel={toggling ? "..." : taxeToToggle?.actif ? "Désactiver" : "Activer"}
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
