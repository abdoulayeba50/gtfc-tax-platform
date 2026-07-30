import api from "@/lib/api";

/**
 * Centralise tous les appels HTTP du module Commerces, sur le meme modele
 * que utilisateursService.js.
 */
export const commercesService = {
  list(params) {
    return api.get("/commerces", { params }).then((res) => res.data);
  },

  getOptions() {
    return api.get("/commerces/options").then((res) => res.data);
  },

  create(payload) {
    return api.post("/commerces", payload).then((res) => res.data);
  },

  update(id, payload) {
    return api.put(`/commerces/${id}`, payload).then((res) => res.data);
  },

  updateStatut(id, statut) {
    return api.patch(`/commerces/${id}/statut`, { statut }).then((res) => res.data);
  },
};
