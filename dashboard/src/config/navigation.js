import {
  LayoutDashboard,
  Building2,
  Store,
  Receipt,
  ClipboardList,
  Wallet,
  Map,
  Users,
  Settings,
} from "lucide-react";

/**
 * Source unique de verite pour les liens de la sidebar.
 * Quand un module (Communes, Commerces, Taxes...) sera developpe, il suffira
 * de faire pointer son "href" vers une vraie route au lieu d'ajouter du JSX
 * directement dans le composant Sidebar.
 */
export const navigation = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Commerces", href: "/dashboard/commerces", icon: Store },
  { label: "Taxes", href: "/dashboard/taxes", icon: Receipt },
  { label: "Créances", href: "/dashboard/creances", icon: ClipboardList },
  { label: "Paiements", href: "/paiements", icon: Wallet },
  { label: "Carte", href: "/carte", icon: Map },
  { label: "Utilisateurs", href: "/dashboard/utilisateurs", icon: Users },
  { label: "Communes", href: "/communes", icon: Building2 },
  { label: "Paramètres", href: "/parametres", icon: Settings },
];
