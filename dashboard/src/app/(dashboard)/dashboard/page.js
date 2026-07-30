import { Store, Wallet, Receipt, TrendingUp, Map } from "lucide-react";

const statPlaceholders = [
  { label: "Commerces enregistrés", icon: Store },
  { label: "Paiements ce mois", icon: Wallet },
  { label: "Taxes actives", icon: Receipt },
  { label: "Taux de recouvrement", icon: TrendingUp },
];

/**
 * Dashboard vide : aucune donnee reelle, aucun appel API. Juste la structure
 * visuelle qui accueillera les statistiques une fois le backend branche.
 * Les cartes en pointilles indiquent clairement "en attente de donnees",
 * plutot que d'afficher de fausses valeurs.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-neutral-900">
          Bienvenue sur GTFC Tax Platform
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Commune de Gueule Tapée-Fass-Colobane — vue d&apos;ensemble de la collecte des taxes locales.
        </p>
      </div>

      {/* Cartes de statistiques (placeholders, pas de donnees reelles) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statPlaceholders.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-dashed border-neutral-300 bg-white p-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-50">
              <Icon className="h-[18px] w-[18px] text-primary-600" strokeWidth={1.75} />
            </div>
            <p className="mt-4 text-2xl font-semibold text-neutral-300">—</p>
            <p className="mt-1 text-sm text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Zone reservee a la carte / aux graphiques */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <Map className="h-6 w-6 text-primary-600" strokeWidth={1.75} />
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-700">
          Les statistiques et la carte des commerces s&apos;afficheront ici
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Cette section sera connectée à l&apos;API backend dans une prochaine étape.
        </p>
      </div>
    </div>
  );
}
