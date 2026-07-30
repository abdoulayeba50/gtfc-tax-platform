"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(undefined);

const TOKEN_KEY = "gtfc_token";
const USER_KEY = "gtfc_user";

/**
 * Source unique de verite pour la session utilisateur cote Dashboard.
 * Enveloppe toute l'application (voir app/layout.js) pour que n'importe
 * quelle page/composant puisse lire l'utilisateur connecte via useAuth(),
 * sans avoir a relire localStorage a chaque fois.
 */
export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // isLoading = "on n'a pas encore fini de verifier s'il y a une session
  // existante dans localStorage". Indispensable pour eviter un flash
  // "redirection vers /login" au premier rendu, avant meme d'avoir pu lire
  // le token (voir ProtectedRoute.jsx).
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // donnees corrompues (JSON invalide) -> on repart sur une session propre
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  /**
   * Appelee par la page de login apres un POST /api/auth/login reussi.
   * Met a jour le state React ET localStorage en meme temps, pour que
   * toute l'app (Header, ProtectedRoute...) le sache immediatement, sans
   * attendre un rechargement de page.
   */
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook d'acces au contexte. Leve une erreur explicite si utilise en dehors
 * du AuthProvider plutot que de planter avec un "Cannot read undefined".
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth() doit être utilisé à l'intérieur d'un <AuthProvider>.");
  }
  return context;
}
