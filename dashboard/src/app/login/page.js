"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Ecran de connexion, branche sur POST /api/auth/login.
 *
 * Flux :
 * 1. L'utilisateur saisit email + mot de passe (champs controles).
 * 2. A la soumission, on appelle le backend via l'instance Axios centralisee.
 * 3. Succes -> AuthContext.login() enregistre le token + l'utilisateur
 *    (state React + localStorage), puis redirection vers /dashboard.
 * 4. Echec -> le message d'erreur renvoye par le backend (ex: "Email ou
 *    mot de passe incorrect") est affiche au-dessus du formulaire.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        mot_de_passe: motDePasse,
      });

      const { token, utilisateur } = response.data.data;

      // Passe par AuthContext plutot que d'ecrire dans localStorage
      // directement : tout le reste de l'app (Header, ProtectedRoute) est
      // notifie immediatement via le state React, sans rechargement de page.
      login(token, utilisateur);

      router.push("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Impossible de se connecter. Vérifiez votre connexion et réessayez.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau institutionnel */}
      <div className="relative hidden overflow-hidden bg-primary-900 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        {/* Signature visuelle : anneaux concentriques evoquant un sceau
            administratif, en trait fin et faible opacite. Purement
            geometrique et abstrait — pas un embleme officiel reproduit. */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-32 h-[32rem] w-[32rem] text-primary-700/40"
          viewBox="0 0 400 400"
          fill="none"
        >
          {[60, 100, 140, 180].map((r) => (
            <circle key={r} cx="200" cy="200" r={r} stroke="currentColor" strokeWidth="1" />
          ))}
        </svg>

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-500">
            <Landmark className="h-5 w-5 text-white" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium tracking-wide text-primary-100">
            GTFC Tax Platform
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl leading-tight text-white">
            Commune de Gueule Tapée-Fass-Colobane
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-200">
            Plateforme de gestion et de traitement de la fiscalité communale —
            un outil unique pour le suivi des commerces, des taxes et des
            paiements collectés sur le terrain.
          </p>
        </div>

        <p className="relative text-xs text-primary-300">
          © {new Date().getFullYear()} Mairie de Gueule Tapée-Fass-Colobane
        </p>
      </div>

      {/* Panneau formulaire */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Identite visible uniquement sur mobile (le panneau de gauche est masque) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-900">
              <Landmark className="h-5 w-5 text-white" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-semibold text-neutral-900">GTFC Tax Platform</span>
          </div>

          <h2 className="text-xl font-semibold text-neutral-900">Connexion</h2>
          <p className="mt-1.5 text-sm text-neutral-500">
            Accédez à votre espace de gestion communale.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Adresse email
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400"
                  strokeWidth={1.75}
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@gtfc.sn"
                  className="w-full rounded-md border border-neutral-300 py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Mot de passe
                </label>
                <a href="#" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400"
                  strokeWidth={1.75}
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-neutral-300 py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-neutral-400">
            Accès réservé aux agents et administrateurs habilités de la commune.
          </p>
        </div>
      </div>
    </div>
  );
}
