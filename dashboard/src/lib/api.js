import axios from "axios";

/**
 * Instance Axios unique pour toute l'application.
 * Tous les futurs appels API (communes, commerces, taxes...) passeront par
 * ce client plutot que de recreer axios.create() a chaque endroit — une
 * seule base URL a changer si l'adresse du backend evolue.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Attache automatiquement le token JWT (s'il existe) sur chaque requête
 * sortante. Ainsi, un futur appel a une route protegee
 * (ex: api.get('/utilisateurs')) n'a pas besoin de gerer le header
 * manuellement a chaque fois.
 */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("gtfc_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
