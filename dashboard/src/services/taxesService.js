import api from "@/lib/api";

/**
 * Centralise tous les appels HTTP du module Taxes, meme modele que
 * utilisateursService.js et commercesService.js.
 */
export const taxesService = {
  list(params) {
    return api.get("/taxes", { params }).then((res) => res.data);
  },

  getOptions() {
    return api.get("/taxes/options").then((res) => res.data);
  },

  create(payload) {
    return api.post("/taxes", payload).then((res) => res.data);
  },

  update(id, payload) {
    return api.put(`/taxes/${id}`, payload).then((res) => res.data);
  },

  updateStatut(id, actif) {
    return api.patch(`/taxes/${id}/statut`, { actif }).then((res) => res.data);
  },
};
