"use client";

import { useState } from "react";
import { Store, Tag, Coins, CalendarClock, CalendarDays, FileText, Repeat } from "lucide-react";

const FREQUENCE_LABELS = {
  journaliere: "Journalière",
  hebdomadaire: "Hebdomadaire",
  mensuelle: "Mensuelle",
  trimestrielle: "Trimestrielle",
  annuelle: "Annuelle",
};

function toDateInputValue(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

/**
 * Formulaire reutilise pour "Ajouter" et "Modifier" une taxe.
 * La devise est fixe (FCFA) et n'est pas un champ modifiable.
 */
export default function TaxeForm({ initialData, commerces, categories, frequences, onSubmit, onCancel, submitting }) {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState({
    commerce_id: initialData?.commerce_id ?? commerces[0]?.id ?? "",
    categorie_id: initialData?.categorie_id ?? categories[0]?.id ?? "",
    nom: initialData?.nom ?? "",
    montant: initialData?.montant ?? "",
    frequence: initialData?.frequence ?? frequences[0] ?? "mensuelle",
    date_debut: toDateInputValue(initialData?.date_debut) || new Date().toISOString().slice(0, 10),
    date_fin: toDateInputValue(initialData?.date_fin),
    description: initialData?.description ?? "",
  });
  const [errors, setErrors] = useState({});

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.commerce_id) next.commerce_id = "Le commerce est requis";
    if (!form.categorie_id) next.categorie_id = "La catégorie est requise";
    if (!form.nom.trim()) next.nom = "Le nom de la taxe est requis";
    if (form.montant === "" || Number(form.montant) < 0) next.montant = "Montant invalide";
    if (!form.frequence) next.frequence = "La fréquence est requise";
    if (!form.date_debut) next.date_debut = "La date de début est requise";
    if (form.date_fin && form.date_fin < form.date_debut) {
      next.date_fin = "Doit être postérieure ou égale à la date de début";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      commerce_id: Number(form.commerce_id),
      categorie_id: Number(form.categorie_id),
      nom: form.nom,
      montant: Number(form.montant),
      frequence: form.frequence,
      date_debut: form.date_debut,
      date_fin: form.date_fin || null,
      description: form.description || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Commerce" error={errors.commerce_id}>
        <IconSelect
          icon={Store}
          value={form.commerce_id}
          onChange={(v) => updateField("commerce_id", v)}
          options={commerces.map((c) => ({ value: c.id, label: `${c.nom_commerce} — ${c.nom_proprietaire}` }))}
          placeholder="Choisir un commerce..."
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom de la taxe" error={errors.nom}>
          <IconInput icon={Tag} value={form.nom} onChange={(v) => updateField("nom", v)} placeholder="Redevance marché mensuelle" />
        </Field>
        <Field label="Catégorie" error={errors.categorie_id}>
          <IconSelect
            icon={Tag}
            value={form.categorie_id}
            onChange={(v) => updateField("categorie_id", v)}
            options={categories.map((c) => ({ value: c.id, label: c.nom }))}
            placeholder="Choisir..."
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Montant (FCFA)" error={errors.montant}>
          <IconInput icon={Coins} type="number" min="0" value={form.montant} onChange={(v) => updateField("montant", v)} placeholder="5000" />
        </Field>
        <Field label="Fréquence" error={errors.frequence}>
          <IconSelect
            icon={Repeat}
            value={form.frequence}
            onChange={(v) => updateField("frequence", v)}
            options={frequences.map((f) => ({ value: f, label: FREQUENCE_LABELS[f] ?? f }))}
            placeholder="Choisir..."
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date de début" error={errors.date_debut}>
          <IconInput icon={CalendarClock} type="date" value={form.date_debut} onChange={(v) => updateField("date_debut", v)} />
        </Field>
        <Field label="Date de fin (optionnelle)" error={errors.date_fin}>
          <IconInput icon={CalendarDays} type="date" value={form.date_fin} onChange={(v) => updateField("date_fin", v)} />
        </Field>
      </div>

      <Field label="Description (optionnelle)">
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3 top-3 h-[18px] w-[18px] text-neutral-400" strokeWidth={1.75} />
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            placeholder="Précisions sur cette taxe..."
            className="w-full rounded-md border border-neutral-300 py-2 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </Field>

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
          {submitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer la taxe"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function IconInput({ icon: Icon, value, onChange, type = "text", min, placeholder }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-300 py-2 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
}

function IconSelect({ icon: Icon, value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
