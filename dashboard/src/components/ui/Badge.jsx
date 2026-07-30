/**
 * Petit badge colore reutilisable (statut actif/inactif, role...).
 * "tone" pilote la couleur plutot que de passer des classes brutes a
 * chaque usage, pour garder une palette coherente dans toute l'app.
 */
const TONES = {
  neutral: "bg-neutral-100 text-neutral-700",
  green: "bg-primary-50 text-primary-700",
  red: "bg-red-50 text-red-700",
};

export default function Badge({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone] ?? TONES.neutral}`}
    >
      {children}
    </span>
  );
}
