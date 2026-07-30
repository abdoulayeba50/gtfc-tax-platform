import { Phone, MapPin, Building2, Landmark, Tag, Hash, FileText, Map, Calendar } from "lucide-react";
import Badge from "@/components/ui/Badge";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Vue en lecture seule d'un commerce, affichee dans le bouton "Voir".
 * Consomme directement la forme renvoyee par GET /api/commerces/:id.
 */
export default function CommerceDetails({ commerce }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-neutral-900">{commerce.nom_commerce}</p>
          <p className="text-sm text-neutral-500">{commerce.nom_proprietaire}</p>
        </div>
        <Badge tone={commerce.statut === "actif" ? "green" : "red"}>
          {commerce.statut === "actif" ? "Actif" : "Inactif"}
        </Badge>
      </div>

      <dl className="space-y-3 border-t border-neutral-200 pt-4">
        <DetailRow icon={Phone} label="Téléphone" value={commerce.telephone} />
        <DetailRow icon={MapPin} label="Adresse" value={commerce.adresse} />
        <DetailRow icon={Building2} label="Quartier" value={commerce.quartier} />
        <DetailRow icon={Landmark} label="Commune" value={commerce.commune} />
        <DetailRow icon={Tag} label="Secteur d'activité" value={commerce.secteur} />
        <DetailRow icon={FileText} label="Numéro registre" value={commerce.numero_registre || "—"} />
        <DetailRow icon={Hash} label="Numéro NINEA" value={commerce.numero_ninea || "—"} />
        <DetailRow
          icon={Map}
          label="Coordonnées GPS"
          value={commerce.latitude && commerce.longitude ? `${commerce.latitude}, ${commerce.longitude}` : "—"}
        />
        <DetailRow icon={Calendar} label="Créé le" value={formatDate(commerce.created_at)} />
      </dl>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-400" strokeWidth={1.75} />
      <div>
        <dt className="text-xs text-neutral-500">{label}</dt>
        <dd className="text-sm text-neutral-900">{value}</dd>
      </div>
    </div>
  );
}
