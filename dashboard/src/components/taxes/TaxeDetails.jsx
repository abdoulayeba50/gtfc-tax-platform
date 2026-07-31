import { Store, User, Tag, Coins, Repeat, CalendarClock, CalendarDays, Calendar, FileText } from "lucide-react";
import Badge from "@/components/ui/Badge";

const FREQUENCE_LABELS = {
  journaliere: "Journalière",
  hebdomadaire: "Hebdomadaire",
  mensuelle: "Mensuelle",
  trimestrielle: "Trimestrielle",
  annuelle: "Annuelle",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatMontant(value, devise) {
  return `${Number(value).toLocaleString("fr-FR")} ${devise}`;
}

/**
 * Vue en lecture seule d'une taxe. Affiche aussi les informations
 * principales du commerce associe, comme demande.
 */
export default function TaxeDetails({ taxe }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-neutral-900">{taxe.nom}</p>
          <Badge tone="neutral">{taxe.categorie}</Badge>
        </div>
        <Badge tone={taxe.actif ? "green" : "red"}>{taxe.actif ? "Actif" : "Inactif"}</Badge>
      </div>

      <dl className="grid grid-cols-1 gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-2">
        <DetailRow icon={Coins} label="Montant" value={formatMontant(taxe.montant, taxe.devise)} />
        <DetailRow icon={Repeat} label="Fréquence" value={FREQUENCE_LABELS[taxe.frequence] ?? taxe.frequence} />
        <DetailRow icon={CalendarClock} label="Date de début" value={formatDate(taxe.date_debut)} />
        <DetailRow icon={CalendarDays} label="Date de fin" value={formatDate(taxe.date_fin)} />
        {taxe.description && (
          <DetailRow icon={FileText} label="Description" value={taxe.description} full />
        )}
        <DetailRow icon={Calendar} label="Créée le" value={formatDate(taxe.created_at)} />
      </dl>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Commerce concerné</p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <Store className="h-5 w-5 text-primary-700" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">{taxe.commerce}</p>
            <p className="flex items-center gap-1 text-xs text-neutral-500">
              <User className="h-3 w-3" strokeWidth={1.75} />
              {taxe.commerce_proprietaire}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, full = false }) {
  return (
    <div className={`flex items-start gap-3 ${full ? "sm:col-span-2" : ""}`}>
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-400" strokeWidth={1.75} />
      <div>
        <dt className="text-xs text-neutral-500">{label}</dt>
        <dd className="text-sm text-neutral-900">{value}</dd>
      </div>
    </div>
  );
}
