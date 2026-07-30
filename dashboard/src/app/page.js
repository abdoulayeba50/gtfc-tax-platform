import { redirect } from "next/navigation";

/**
 * Racine de l'application : redirige directement vers l'ecran de connexion.
 * Une fois l'authentification connectee au backend, on redirigera plutot
 * en fonction de la presence d'une session valide.
 */
export default function RootPage() {
  redirect("/login");
}
