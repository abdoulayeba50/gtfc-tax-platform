-- ============================================================================
-- Categories de taxes de reference pour la commune GTFC (a executer une fois,
-- APRES database/migration-taxes.sql)
-- Idempotent : ne recree rien si une categorie du meme nom existe deja.
-- ============================================================================

INSERT INTO categories_taxes (commune_id, nom)
SELECT (SELECT id FROM communes WHERE code = 'GTFC'), cat.nom
FROM (VALUES
    ('Occupation domaine public'),
    ('Taxe municipale'),
    ('Redevance marché'),
    ('Redevance voirie'),
    ('Publicité'),
    ('Terrasse'),
    ('Licence commerciale')
) AS cat(nom)
WHERE NOT EXISTS (
    SELECT 1 FROM categories_taxes WHERE nom = cat.nom
      AND commune_id = (SELECT id FROM communes WHERE code = 'GTFC')
);

-- Verification
SELECT id, nom FROM categories_taxes ORDER BY nom;
