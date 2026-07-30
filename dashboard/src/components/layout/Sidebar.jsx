"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark } from "lucide-react";
import { navigation } from "@/config/navigation";

/**
 * Sidebar fixe a gauche. Fond bleu institutionnel fonce (primary-900),
 * pour ancrer visuellement l'identite "administration communale" des
 * qu'on ouvre l'application, sur toutes les pages du dashboard.
 */
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-primary-900 text-white h-screen sticky top-0">
      {/* Identite de la commune */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-500">
          <Landmark className="h-5 w-5 text-white" strokeWidth={1.75} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-wide">GTFC</p>
          <p className="text-[11px] text-primary-200">Gestion fiscale</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary-700 text-white font-medium"
                      : "text-primary-100 hover:bg-primary-800 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? "text-white" : "text-primary-300 group-hover:text-white"
                    }`}
                    strokeWidth={1.75}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Pied de sidebar */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-[11px] text-primary-300">GTFC Tax Platform v1.0.0</p>
      </div>
    </aside>
  );
}
