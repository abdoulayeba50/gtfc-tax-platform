import api from "@/lib/api";

/**
 * Centralise tous les appels HTTP du module Utilisateurs.
 * La page ne connait que ces fonctions, jamais les URLs/verbes HTTP
 * directement — si une route change cote backend, seul ce fichier bouge.
 */
export const utilisateursService = {
  list(params) {
    return api.get("/utilisateurs", { params }).then((res) => res.data);
  },

  getOptions() {
    return api.get("/utilisateurs/options").then((res) => res.data);
  },

  create(payload) {
    return api.post("/utilisateurs", payload).then((res) => res.data);
  },

  update(id, payload) {
    return api.put(`/utilisateurs/${id}`, payload).then((res) => res.data);
  },

  updateStatut(id, actif) {
    return api.patch(`/utilisateurs/${id}/statut`, { actif }).then((res) => res.data);
  },
};
