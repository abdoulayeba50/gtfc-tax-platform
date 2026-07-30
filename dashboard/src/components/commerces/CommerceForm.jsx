"use client";

import { useMemo, useState } from "react";
import { Store, User, Phone, MapPin, Building2, Landmark, Tag, Hash, FileText, Map } from "lucide-react";

/**
 * Formulaire reutilise pour "Ajouter" et "Modifier" un commerce.
 * Le select "Quartier" et le select "Secteur" sont filtres dynamiquement
 * selon la commune choisie (quartiers/categories sont chacun rattaches a
 * une commune_id), pour ne jamais proposer un quartier d'une autre commune.
 */
export default function CommerceForm({ initialData, communes, quartiers, categories, onSubmit, onCancel, submitting }) {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState({
    nom_commerce: initialData?.nom_commerce ?? "",
    nom_proprietaire: initialData?.nom_proprietaire ?? "",
    telephone: initialData?.telephone ?? "",
    adresse: initialData?.adresse ?? "",
    commune_id: initialData?.commune_id ?? communes[0]?.id ?? "",
    quartier_id: initialData?.quartier_id ?? "",
    categorie_id: initialData?.categorie_id ?? "",
    numero_registre: initialData?.numero_registre ?? "",
    numero_ninea: initialData?.numero_ninea ?? "",
    latitude: initialData?.latitude ?? "",
    longitude: initialData?.longitude ?? "",
  });
  const [errors, setErrors] = useState({});

  const quartiersFiltres = useMemo(
    () => quartiers.filter((q) => String(q.commune_id) === String(form.commune_id)),
    [quartiers, form.commune_id]
  );
  const categoriesFiltrees = useMemo(
    () => categories.filter((c) => String(c.commune_id) === String(form.commune_id)),
    [categories, form.commune_id]
  );

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Changer de commune invalide le quartier/secteur precedemment choisis
      // s'ils n'appartiennent plus a la nouvelle commune.
      if (field === "commune_id") {
        next.quartier_id = "";
        next.categorie_id = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.nom_commerce.trim()) next.nom_commerce = "Le nom du commerce est requis";
    if (!form.nom_proprietaire.trim()) next.nom_proprietaire = "Le nom du propriétaire est requis";
    if (!form.telephone.trim()) next.telephone = "Le téléphone est requis";
    if (!form.adresse.trim()) next.adresse = "L'adresse est requise";
    if (!form.commune_id) next.commune_id = "La commune est requise";
    if (!form.quartier_id) next.quartier_id = "Le quartier est requis";
    if (!form.categorie_id) next.categorie_id = "Le secteur d'activité est requis";

    if (form.latitude && (Number(form.latitude) < -90 || Number(form.latitude) > 90)) {
      next.latitude = "Doit être entre -90 et 90";
    }
    if (form.longitude && (Number(form.longitude) < -180 || Number(form.longitude) > 180)) {
      next.longitude = "Doit être entre -180 et 180";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      nom_commerce: form.nom_commerce,
      nom_proprietaire: form.nom_proprietaire,
      telephone: form.telephone,
      adresse: form.adresse,
      commune_id: Number(form.commune_id),
      quartier_id: Number(form.quartier_id),
      categorie_id: Number(form.categorie_id),
      numero_registre: form.numero_registre || null,
      numero_ninea: form.numero_ninea || null,
      latitude: form.latitude !== "" ? Number(form.latitude) : null,
      longitude: form.longitude !== "" ? Number(form.longitude) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom du commerce" error={errors.nom_commerce}>
          <IconInput icon={Store} value={form.nom_commerce} onChange={(v) => updateField("nom_commerce", v)} placeholder="Boutique Toba" />
        </Field>
        <Field label="Nom du propriétaire" error={errors.nom_proprietaire}>
          <IconInput icon={User} value={form.nom_proprietaire} onChange={(v) => updateField("nom_proprietaire", v)} placeholder="Toba Ndiaye" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Téléphone" error={errors.telephone}>
          <IconInput icon={Phone} value={form.telephone} onChange={(v) => updateField("telephone", v)} placeholder="77 123 45 67" />
        </Field>
        <Field label="Adresse" error={errors.adresse}>
          <IconInput icon={MapPin} value={form.adresse} onChange={(v) => updateField("adresse", v)} placeholder="12 rue du marché" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Commune" error={errors.commune_id}>
          <IconSelect
            icon={Landmark}
            value={form.commune_id}
            onChange={(v) => updateField("commune_id", v)}
            options={communes.map((c) => ({ value: c.id, label: c.nom }))}
            placeholder="Choisir..."
          />
        </Field>
        <Field label="Quartier" error={errors.quartier_id}>
          <IconSelect
            icon={Building2}
            value={form.quartier_id}
            onChange={(v) => updateField("quartier_id", v)}
            options={quartiersFiltres.map((q) => ({ value: q.id, label: q.nom }))}
            placeholder={form.commune_id ? "Choisir..." : "Choisir une commune d'abord"}
            disabled={!form.commune_id}
          />
        </Field>
        <Field label="Secteur d'activité" error={errors.categorie_id}>
          <IconSelect
            icon={Tag}
            value={form.categorie_id}
            onChange={(v) => updateField("categorie_id", v)}
            options={categoriesFiltrees.map((c) => ({ value: c.id, label: c.nom }))}
            placeholder={form.commune_id ? "Choisir..." : "Choisir une commune d'abord"}
            disabled={!form.commune_id}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Numéro registre (optionnel)">
          <IconInput icon={FileText} value={form.numero_registre} onChange={(v) => updateField("numero_registre", v)} placeholder="SN-DKR-2026-A-1234" />
        </Field>
        <Field label="Numéro NINEA (optionnel)">
          <IconInput icon={Hash} value={form.numero_ninea} onChange={(v) => updateField("numero_ninea", v)} placeholder="0012345678" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Latitude (optionnelle)" error={errors.latitude}>
          <IconInput icon={Map} type="number" step="any" value={form.latitude} onChange={(v) => updateField("latitude", v)} placeholder="14.6928" />
        </Field>
        <Field label="Longitude (optionnelle)" error={errors.longitude}>
          <IconInput icon={Map} type="number" step="any" value={form.longitude} onChange={(v) => updateField("longitude", v)} placeholder="-17.4467" />
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
          {submitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le commerce"}
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

function IconInput({ icon: Icon, value, onChange, type = "text", step, placeholder }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-300 py-2 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
}

function IconSelect({ icon: Icon, value, onChange, options, placeholder, disabled }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-md border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-neutral-50 disabled:text-neutral-400"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
