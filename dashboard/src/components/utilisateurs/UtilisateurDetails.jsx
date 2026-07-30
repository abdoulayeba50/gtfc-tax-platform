import { Mail, Phone, Shield, Building2, Calendar, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Vue en lecture seule d'un utilisateur, affichee dans le bouton "Voir".
 * Consomme directement la forme renvoyee par GET /api/utilisateurs/:id
 * (actif: boolean, created_at, derniere_connexion nullable, role/commune
 * deja resolus par les jointures backend).
 */
export default function UtilisateurDetails({ utilisateur }) {
  const initials = `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase();
  const derniereConnexion = formatDate(utilisateur.derniere_connexion);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
          {initials}
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-900">
            {utilisateur.prenom} {utilisateur.nom}
          </p>
          <Badge tone={utilisateur.actif ? "green" : "red"}>
            {utilisateur.actif ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </div>

      <dl className="space-y-3 border-t border-neutral-200 pt-4">
        <DetailRow icon={Mail} label="Email" value={utilisateur.email} />
        <DetailRow icon={Phone} label="Téléphone" value={utilisateur.telephone || "—"} />
        <DetailRow icon={Shield} label="Rôle" value={utilisateur.role} />
        <DetailRow icon={Building2} label="Commune" value={utilisateur.commune || "—"} />
        <DetailRow icon={Calendar} label="Créé le" value={formatDate(utilisateur.created_at)} />
        <DetailRow
          icon={Clock}
          label="Dernière connexion"
          value={derniereConnexion || "Jamais connecté"}
        />
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
