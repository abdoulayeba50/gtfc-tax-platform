"use client";

import { useState } from "react";
import { User, Mail, Phone, Shield, Building2, Lock } from "lucide-react";

/**
 * Formulaire reutilise pour "Ajouter" et "Modifier" un utilisateur.
 * Branche sur l'API reelle : role_id/commune_id sont des identifiants
 * numeriques (chargés depuis GET /api/utilisateurs/options), pas des noms
 * en texte libre — c'est exactement ce que le backend attend.
 *
 * En mode edition (initialData fourni), les mots de passe restent vides et
 * facultatifs : on ne force pas a en resaisir un pour juste changer un
 * telephone. Le statut n'est pas dans ce formulaire — il se gere via le
 * bouton dedie Activer/Desactiver dans le tableau.
 */
export default function UtilisateurForm({ initialData, roles, communes, onSubmit, onCancel, submitting }) {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState({
    prenom: initialData?.prenom ?? "",
    nom: initialData?.nom ?? "",
    email: initialData?.email ?? "",
    telephone: initialData?.telephone ?? "",
    role_id: initialData?.role_id ?? roles[0]?.id ?? "",
    commune_id: initialData?.commune_id ?? communes[0]?.id ?? "",
    mot_de_passe: "",
    confirmer_mot_de_passe: "",
  });
  const [errors, setErrors] = useState({});

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next = {};

    if (!form.prenom.trim()) next.prenom = "Le prénom est requis";
    if (!form.nom.trim()) next.nom = "Le nom est requis";
    if (!form.email.trim()) {
      next.email = "L'email est requis";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Format d'email invalide";
    }
    if (!form.telephone.trim()) next.telephone = "Le téléphone est requis";
    if (!form.role_id) next.role_id = "Le rôle est requis";

    // Mot de passe requis a la creation, optionnel a l'edition
    if (!isEdit || form.mot_de_passe) {
      if (!isEdit && !form.mot_de_passe) {
        next.mot_de_passe = "Le mot de passe est requis";
      } else if (form.mot_de_passe && form.mot_de_passe.length < 6) {
        next.mot_de_passe = "Au moins 6 caractères";
      }
      if (form.mot_de_passe !== form.confirmer_mot_de_passe) {
        next.confirmer_mot_de_passe = "Les mots de passe ne correspondent pas";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    // confirmer_mot_de_passe ne part jamais au backend : validation
    // uniquement cote client, l'API n'a besoin que de mot_de_passe.
    const { confirmer_mot_de_passe, mot_de_passe, ...rest } = form;
    const payload = {
      ...rest,
      role_id: Number(form.role_id),
      commune_id: form.commune_id ? Number(form.commune_id) : null,
    };
    if (mot_de_passe) payload.mot_de_passe = mot_de_passe;

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prénom" error={errors.prenom}>
          <IconInput icon={User} value={form.prenom} onChange={(v) => updateField("prenom", v)} placeholder="Toba" />
        </Field>
        <Field label="Nom" error={errors.nom}>
          <IconInput icon={User} value={form.nom} onChange={(v) => updateField("nom", v)} placeholder="Ndiaye" />
        </Field>
      </div>

      <Field label="Adresse email" error={errors.email}>
        <IconInput
          icon={Mail}
          type="email"
          value={form.email}
          onChange={(v) => updateField("email", v)}
          placeholder="agent@gtfc.sn"
        />
      </Field>

      <Field label="Téléphone" error={errors.telephone}>
        <IconInput
          icon={Phone}
          value={form.telephone}
          onChange={(v) => updateField("telephone", v)}
          placeholder="77 123 45 67"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Rôle" error={errors.role_id}>
          <IconSelect
            icon={Shield}
            value={form.role_id}
            onChange={(v) => updateField("role_id", v)}
            options={roles.map((r) => ({ value: r.id, label: r.nom }))}
          />
        </Field>
        <Field label="Commune">
          <IconSelect
            icon={Building2}
            value={form.commune_id}
            onChange={(v) => updateField("commune_id", v)}
            options={communes.map((c) => ({ value: c.id, label: c.nom }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mot de passe" error={errors.mot_de_passe}>
          <IconInput
            icon={Lock}
            type="password"
            value={form.mot_de_passe}
            onChange={(v) => updateField("mot_de_passe", v)}
            placeholder={isEdit ? "Laisser vide pour ne pas changer" : "••••••••"}
          />
        </Field>
        <Field label="Confirmer le mot de passe" error={errors.confirmer_mot_de_passe}>
          <IconInput
            icon={Lock}
            type="password"
            value={form.confirmer_mot_de_passe}
            onChange={(v) => updateField("confirmer_mot_de_passe", v)}
            placeholder="••••••••"
          />
        </Field>
      </div>

      <div className="mt-2 flex justify-end gap-2.5 border-t border-neutral-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary-900 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
        >
          {submitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer l'utilisateur"}
        </button>
      </div>
    </form>
  );
}

/* --- Petits sous-composants locaux au formulaire --- */

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function IconInput({ icon: Icon, value, onChange, type = "text", placeholder }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-300 py-2 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
}

function IconSelect({ icon: Icon, value, onChange, options }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
