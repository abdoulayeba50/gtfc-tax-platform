import api from "@/lib/api";

/**
 * Centralise tous les appels HTTP du module Creances, meme modele que les
 * autres services (utilisateurs, commerces, taxes).
 */
export const creancesService = {
  list(params) {
    return api.get("/creances", { params }).then((res) => res.data);
  },

  getOptions() {
    return api.get("/creances/options").then((res) => res.data);
  },

  generer() {
    return api.post("/creances/generer").then((res) => res.data);
  },
};
