"use client";

import { useState } from "react";
import { X, Landmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { navigation } from "@/config/navigation";

/**
 * Layout partage par toutes les pages du dashboard (groupe de routes
 * "(dashboard)", qui n'apparait pas dans l'URL). Rassemble la Sidebar fixe,
 * le Header, et gere l'ouverture/fermeture du tiroir de navigation mobile
 * (la Sidebar "de bureau" est masquee sous lg, cf. Sidebar.jsx).
 *
 * Enveloppe le tout dans ProtectedRoute : impossible d'atteindre une page
 * de ce groupe (dashboard, commerces, taxes...) sans session valide.
 */
export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-neutral-50">
        <Sidebar />

      {/* Tiroir de navigation mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-neutral-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-primary-900 text-white flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500">
                  <Landmark className="h-4 w-4 text-white" strokeWidth={1.75} />
                </div>
                <span className="text-sm font-semibold">GTFC</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-primary-200 hover:bg-primary-800"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                          isActive
                            ? "bg-primary-700 text-white font-medium"
                            : "text-primary-100 hover:bg-primary-800 hover:text-white"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      </div>
    </ProtectedRoute>
  );
}
