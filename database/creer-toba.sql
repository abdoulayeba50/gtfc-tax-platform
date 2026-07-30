-- ============================================================================
-- Creation d'un deuxieme utilisateur de test (a executer une seule fois)
-- Prenom       : Toba
-- Nom          : Ndiaye
-- Email        : toba@gtfc.sn
-- Telephone    : 776884909
-- Role         : Admin Commune
-- Mot de passe : Toba2026!
--
-- Idempotent : si l'email existe deja, rien n'est insere (aucun doublon,
-- aucune erreur meme si le script est relance plusieurs fois).
-- ============================================================================

-- 1. Cree la commune GTFC si elle n'existe pas deja (au cas ou ce script
--    serait execute avant creer-admin.sql, sur une base toute neuve).
INSERT INTO communes (nom, code)
SELECT 'Gueule Tapée-Fass-Colobane', 'GTFC'
WHERE NOT EXISTS (SELECT 1 FROM communes WHERE code = 'GTFC');

-- 2. Cree l'utilisateur Toba, rattache a cette commune et au role "Admin Commune"
INSERT INTO utilisateurs (commune_id, role_id, nom, prenom, email, telephone, mot_de_passe)
SELECT
    (SELECT id FROM communes WHERE code = 'GTFC'),
    (SELECT id FROM roles WHERE nom = 'Admin Commune'),
    'Ndiaye',
    'Toba',
    'toba@gtfc.sn',
    '776884909',
    '$2b$10$O25rDaCiQlIWGUusaGsGMefB5PvUNa.lhGwd7ECjCae2waUtjP6R2'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'toba@gtfc.sn');

-- Verification
SELECT id, nom, prenom, email, telephone, commune_id, role_id
FROM utilisateurs
WHERE email = 'toba@gtfc.sn';
