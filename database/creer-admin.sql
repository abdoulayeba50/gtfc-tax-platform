-- ============================================================================
-- Creation du premier utilisateur admin (a executer une seule fois)
-- Email    : admin@gtfc.sn
-- Mot de passe : GtfcAdmin2026!
-- ============================================================================

-- 1. Cree la commune GTFC si elle n'existe pas deja
INSERT INTO communes (nom, code)
SELECT 'Gueule Tapée-Fass-Colobane', 'GTFC'
WHERE NOT EXISTS (SELECT 1 FROM communes WHERE code = 'GTFC');

-- 2. Cree l'utilisateur admin, rattache a cette commune et au role "Admin Commune"
INSERT INTO utilisateurs (commune_id, role_id, nom, prenom, email, mot_de_passe)
SELECT
    (SELECT id FROM communes WHERE code = 'GTFC'),
    (SELECT id FROM roles WHERE nom = 'Admin Commune'),
    'Ba',
    'Abdoulaye',
    'admin@gtfc.sn',
    '$2b$10$65P6SrbMUMiubUAMMZH1gOgpW961C2w1qemlnuOoq4mq7pg6OffqW'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'admin@gtfc.sn');

-- Verification
SELECT id, nom, prenom, email, commune_id, role_id FROM utilisateurs WHERE email = 'admin@gtfc.sn';
