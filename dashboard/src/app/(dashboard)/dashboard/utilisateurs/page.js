"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Eye, Pencil, Power, Users as UsersIcon, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { utilisateursService } from "@/services/utilisateursService";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import UtilisateurForm from "@/components/utilisateurs/UtilisateurForm";
import UtilisateurDetails from "@/components/utilisateurs/UtilisateurDetails";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 350;

/**
 * Module Utilisateurs — branche sur l'API reelle (GET/POST/PUT/PATCH
 * /api/utilisateurs). Toute la logique de chargement/erreurs/pagination
 * vit ici ; les composants enfants (formulaire, fiche, modales) restent
 * de purs composants d'affichage.
 */
export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [roles, setRoles] = useState([]);
  const [communes, setCommunes] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [viewingUser, setViewingUser] = useState(null);
  const [userToToggle, setUserToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const [toast, setToast] = useState(null);

  // Debounce de la recherche : evite un appel API a chaque frappe.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUtilisateurs = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await utilisateursService.list({
        search: debouncedSearch || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        statut: statutFilter !== "all" ? statutFilter : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setUtilisateurs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statutFilter, page]);

  useEffect(() => {
    fetchUtilisateurs();
  }, [fetchUtilisateurs]);

  // Options du formulaire (rôles/communes) chargées une seule fois.
  useEffect(() => {
    utilisateursService
      .getOptions()
      .then((res) => {
        setRoles(res.data.roles);
        setCommunes(res.data.communes);
      })
      .catch(() => {
        // Non bloquant pour l'affichage de la liste ; le formulaire
        // affichera simplement des listes vides si ça échoue.
      });
  }, []);

  function updateRoleFilter(value) {
    setRoleFilter(value);
    setPage(1);
  }
  function updateStatutFilter(value) {
    setStatutFilter(value);
    setPage(1);
  }

  function openAddForm() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEditForm(user) {
    setEditingUser(user);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    setSubmitting(true);
    try {
      if (editingUser) {
        await utilisateursService.update(editingUser.id, data);
        setToast({ type: "success", message: "Utilisateur modifié avec succès." });
      } else {
        await utilisateursService.create(data);
        setToast({ type: "success", message: "Utilisateur créé avec succès." });
      }
      setFormOpen(false);
      await fetchUtilisateurs();
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
      const nextActif = userToToggle.actif ? false : true;
      await utilisateursService.updateStatut(userToToggle.id, nextActif);
      setToast({
        type: "success",
        message: nextActif ? "Utilisateur activé." : "Utilisateur désactivé.",
      });
      setUserToToggle(null);
      await fetchUtilisateurs();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Une erreur est survenue." });
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-neutral-900">Utilisateurs</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Agents, superviseurs et administrateurs ayant accès à la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchUtilisateurs}
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
            Ajouter un utilisateur
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
            placeholder="Rechercher par nom ou email..."
            className="w-full rounded-md border border-neutral-300 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => updateRoleFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white py-2.5 px-3 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">Tous les rôles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.nom}>
              {r.nom}
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
              onClick={fetchUtilisateurs}
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
                    <Th>Utilisateur</Th>
                    <Th>Téléphone</Th>
                    <Th>Rôle</Th>
                    <Th>Commune</Th>
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
                  ) : utilisateurs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <UsersIcon className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                        <p className="mt-3 text-sm text-neutral-500">Aucun utilisateur ne correspond à ces critères.</p>
                      </td>
                    </tr>
                  ) : (
                    utilisateurs.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                              {u.prenom[0]}
                              {u.nom[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-neutral-900">
                                {u.prenom} {u.nom}
                              </p>
                              <p className="truncate text-xs text-neutral-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{u.telephone || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge tone="neutral">{u.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{u.commune || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge tone={u.actif ? "green" : "red"}>{u.actif ? "Actif" : "Inactif"}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <ActionButton label="Voir" onClick={() => setViewingUser(u)} icon={Eye} />
                            <ActionButton label="Modifier" onClick={() => openEditForm(u)} icon={Pencil} />
                            <ActionButton
                              label={u.actif ? "Désactiver" : "Activer"}
                              onClick={() => setUserToToggle(u)}
                              icon={Power}
                              danger={u.actif}
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
        title={editingUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
        widthClass="max-w-xl"
      >
        <UtilisateurForm
          initialData={editingUser}
          roles={roles}
          communes={communes}
          submitting={submitting}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Modal Voir */}
      <Modal open={Boolean(viewingUser)} onClose={() => setViewingUser(null)} title="Fiche utilisateur">
        {viewingUser && <UtilisateurDetails utilisateur={viewingUser} />}
      </Modal>

      {/* Confirmation Activer / Désactiver */}
      <ConfirmDialog
        open={Boolean(userToToggle)}
        onClose={() => setUserToToggle(null)}
        onConfirm={confirmToggleStatut}
        title={userToToggle?.actif ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
        description={
          userToToggle
            ? `${userToToggle.actif ? "Désactiver" : "Activer"} le compte de ${userToToggle.prenom} ${userToToggle.nom} ? ${
                userToToggle.actif ? "Cette personne ne pourra plus se connecter à la plateforme." : ""
              }`
            : ""
        }
        confirmLabel={toggling ? "..." : userToToggle?.actif ? "Désactiver" : "Activer"}
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
