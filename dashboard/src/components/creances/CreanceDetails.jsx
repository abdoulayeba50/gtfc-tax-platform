import { Store, User, Receipt, Coins, Repeat, CalendarClock, CalendarRange, Calendar, Hash } from "lucide-react";
import Badge from "@/components/ui/Badge";

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

/**
 * Vue en lecture seule d'une creance. Reutilise directement l'objet de la
 * liste (deja enrichi par les jointures backend) : pas d'appel API
 * supplementaire necessaire pour l'ouvrir.
 */
export default function CreanceDetails({ creance }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <Hash className="h-3.5 w-3.5" strokeWidth={1.75} />
            {creance.numero}
          </p>
          <p className="mt-1 text-base font-semibold text-neutral-900">{creance.taxe}</p>
        </div>
        <Badge tone={STATUT_TONES[creance.statut] ?? "neutral"}>
          {STATUT_LABELS[creance.statut] ?? creance.statut}
        </Badge>
      </div>

      <dl className="grid grid-cols-1 gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-2">
        <DetailRow icon={Coins} label="Montant" value={`${Number(creance.montant).toLocaleString("fr-FR")} ${creance.devise}`} />
        <DetailRow icon={Repeat} label="Fréquence de la taxe" value={FREQUENCE_LABELS[creance.taxe_frequence] ?? creance.taxe_frequence} />
        <DetailRow icon={CalendarRange} label="Période couverte" value={`${formatDate(creance.periode_debut)} → ${formatDate(creance.periode_fin)}`} full />
        <DetailRow icon={Calendar} label="Date d'émission" value={formatDate(creance.date_emission)} />
        <DetailRow icon={CalendarClock} label="Date d'échéance" value={formatDate(creance.date_echeance)} />
      </dl>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Commerce concerné</p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <Store className="h-5 w-5 text-primary-700" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">{creance.commerce}</p>
            <p className="flex items-center gap-1 text-xs text-neutral-500">
              <User className="h-3 w-3" strokeWidth={1.75} />
              {creance.commerce_proprietaire}
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
