-- ============================================================================
-- Donnees de reference pour le module Commerces (a executer une fois)
--
-- La table commerces exige un quartier_id et un categorie_id valides (cle
-- etrangere NOT NULL). Or aucune zone/quartier/categorie n'a encore ete
-- creee sur la plateforme. Ce script insere un minimum de donnees realistes
-- pour la commune GTFC, pour que le module Commerces soit testable.
-- Idempotent : ne recree rien si les lignes existent deja.
-- ============================================================================

-- 1. Zones (necessite que la commune GTFC existe deja - cf. creer-admin.sql)
INSERT INTO zones (commune_id, nom)
SELECT (SELECT id FROM communes WHERE code = 'GTFC'), z.nom
FROM (VALUES ('Zone Gueule Tapée'), ('Zone Fass'), ('Zone Colobane')) AS z(nom)
WHERE NOT EXISTS (
    SELECT 1 FROM zones WHERE nom = z.nom
      AND commune_id = (SELECT id FROM communes WHERE code = 'GTFC')
);

-- 2. Quartiers (rattaches aux zones ci-dessus)
INSERT INTO quartiers (zone_id, nom)
SELECT (SELECT id FROM zones WHERE nom = q.zone_nom), q.nom
FROM (VALUES
    ('Gueule Tapée Centre', 'Zone Gueule Tapée'),
    ('Gueule Tapée Nord', 'Zone Gueule Tapée'),
    ('Fass Centre', 'Zone Fass'),
    ('Fass Delorme', 'Zone Fass'),
    ('Colobane Marché', 'Zone Colobane'),
    ('Colobane Résidentiel', 'Zone Colobane')
) AS q(nom, zone_nom)
WHERE NOT EXISTS (
    SELECT 1 FROM quartiers WHERE nom = q.nom
      AND zone_id = (SELECT id FROM zones WHERE nom = q.zone_nom)
);

-- 3. Secteurs d'activite (categories_commerces, propres a la commune GTFC)
INSERT INTO categories_commerces (commune_id, nom)
SELECT (SELECT id FROM communes WHERE code = 'GTFC'), cat.nom
FROM (VALUES
    ('Commerce général'), ('Restauration'), ('Marché / Étal'),
    ('Atelier / Artisanat'), ('Services'), ('Boutique / Boucherie')
) AS cat(nom)
WHERE NOT EXISTS (
    SELECT 1 FROM categories_commerces WHERE nom = cat.nom
      AND commune_id = (SELECT id FROM communes WHERE code = 'GTFC')
);

-- Verification
SELECT 'zones' AS table_verifiee, COUNT(*) FROM zones
UNION ALL
SELECT 'quartiers', COUNT(*) FROM quartiers
UNION ALL
SELECT 'categories_commerces', COUNT(*) FROM categories_commerces;
