"use client";

import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu } from "lucide-react";
import { navigation } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Deduit les initiales a afficher dans l'avatar a partir du prenom/nom.
 * Retourne "?" si les infos ne sont pas encore disponibles (securite,
 * ne devrait pas arriver puisque le Header vit derriere ProtectedRoute).
 */
function getInitials(user) {
  if (!user) return "?";
  const p = user.prenom?.[0] ?? "";
  const n = user.nom?.[0] ?? "";
  return (p + n).toUpperCase() || "?";
}

/**
 * Header sticky en haut du contenu. Le titre affiche est deduit de l'URL
 * courante via la meme config que la Sidebar (config/navigation.js) :
 * une seule source de verite pour les libelles, pas de prop a repeter sur
 * chaque page.
 *
 * Le nom, le role et le bouton de deconnexion viennent desormais de
 * AuthContext (voir context/AuthContext.jsx) plutot que d'etre codes en dur.
 */
export default function Header({ onMenuClick }) {
  const pathname = usePathname();
  const currentPage = navigation.find((item) => item.href === pathname);
  const title = currentPage?.label ?? "Tableau de bord";

  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Bouton menu mobile : la sidebar est masquee sous lg (cf. Sidebar.jsx) */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary-500" />
        </button>

        <div className="h-6 w-px bg-neutral-200" />

        {/* Identite de l'utilisateur connecte */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
            {getInitials(user)}
          </div>
          <div className="hidden text-left sm:block leading-tight">
            <p className="text-sm font-medium text-neutral-900">
              {user ? `${user.prenom} ${user.nom}` : "—"}
            </p>
            <p className="text-xs text-neutral-500">{user?.role ?? "—"}</p>
          </div>
        </div>

        <div className="h-6 w-px bg-neutral-200" />

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-500 hover:bg-red-50 hover:text-red-600"
          aria-label="Déconnexion"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
