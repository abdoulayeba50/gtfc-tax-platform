-- ============================================================================
-- Migration : module Taxes
--
-- La table "taxes" du schema.sql initial etait concue comme un CATALOGUE au
-- niveau commune (une taxe generique, assignee ensuite a des commerces via
-- la table de liaison commerce_taxes). La demande actuelle est differente :
-- "une taxe est toujours rattachee a un commerce" -- une ligne = une taxe
-- appliquee a UN commerce precis, avec sa propre categorie et ses propres
-- dates. Cette migration adapte la table "taxes" en consequence.
--
-- Note pour la suite du projet : la table "commerce_taxes" (assignation
-- generique commerce<->taxe avec montant personnalise) et son usage prevu
-- par un futur module Paiements restent inchanges et ne sont pas utilises
-- par ce module. A reconcilier lors du developpement du module Paiements.
--
-- Idempotent : "IF NOT EXISTS" / "DROP ... IF EXISTS" partout.
-- ============================================================================

-- 1. Table des categories de taxes (une commune definit ses propres
--    categories, meme principe que categories_commerces pour les commerces).
CREATE TABLE IF NOT EXISTS categories_taxes (
    id          SERIAL PRIMARY KEY,
    commune_id  INTEGER NOT NULL REFERENCES communes (id) ON DELETE RESTRICT,
    nom         VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_categories_taxes_commune_nom UNIQUE (commune_id, nom)
);

COMMENT ON TABLE categories_taxes IS 'Categories de taxes definies par chaque commune (ex: Occupation domaine public, Redevance marche...).';

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_categories_taxes ON categories_taxes;
CREATE TRIGGER set_updated_at_categories_taxes
    BEFORE UPDATE ON categories_taxes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 2. Adapte la table taxes : ajoute le lien direct vers un commerce, une
--    categorie, une devise et des dates d'application.
--    (Ajout sans risque : la table taxes est vide, aucun module ne l'a
--    encore utilisee avant celui-ci.)
ALTER TABLE taxes ADD COLUMN IF NOT EXISTS commerce_id INTEGER REFERENCES commerces (id) ON DELETE CASCADE;
ALTER TABLE taxes ADD COLUMN IF NOT EXISTS categorie_id INTEGER REFERENCES categories_taxes (id) ON DELETE RESTRICT;
ALTER TABLE taxes ADD COLUMN IF NOT EXISTS devise VARCHAR(10) NOT NULL DEFAULT 'FCFA';
ALTER TABLE taxes ADD COLUMN IF NOT EXISTS date_debut DATE;
ALTER TABLE taxes ADD COLUMN IF NOT EXISTS date_fin DATE;

-- Rend commerce_id et categorie_id obligatoires (la table etant vide,
-- l'operation est instantanee et sans risque de violation).
ALTER TABLE taxes ALTER COLUMN commerce_id SET NOT NULL;
ALTER TABLE taxes ALTER COLUMN categorie_id SET NOT NULL;
ALTER TABLE taxes ALTER COLUMN date_debut SET NOT NULL;

-- L'ancienne contrainte UNIQUE(commune_id, nom) empecherait deux commerces
-- differents d'avoir une taxe de meme nom (ex: "Taxe municipale" partout) :
-- on la remplace par une unicite par commerce.
ALTER TABLE taxes DROP CONSTRAINT IF EXISTS uq_taxes_commune_nom;
ALTER TABLE taxes DROP CONSTRAINT IF EXISTS uq_taxes_commerce_nom;
ALTER TABLE taxes ADD CONSTRAINT uq_taxes_commerce_nom UNIQUE (commerce_id, nom);

-- La periodicite doit desormais inclure "hebdomadaire".
ALTER TABLE taxes DROP CONSTRAINT IF EXISTS chk_taxes_periodicite;
ALTER TABLE taxes ADD CONSTRAINT chk_taxes_periodicite
    CHECK (periodicite IN ('journaliere', 'hebdomadaire', 'mensuelle', 'trimestrielle', 'annuelle', 'unique'));

-- La date de fin, si renseignee, doit etre posterieure ou egale a la date de debut.
ALTER TABLE taxes DROP CONSTRAINT IF EXISTS chk_taxes_dates;
ALTER TABLE taxes ADD CONSTRAINT chk_taxes_dates
    CHECK (date_fin IS NULL OR date_fin >= date_debut);

CREATE INDEX IF NOT EXISTS idx_taxes_commerce_id ON taxes (commerce_id);
CREATE INDEX IF NOT EXISTS idx_taxes_categorie_id ON taxes (categorie_id);

COMMENT ON COLUMN taxes.commerce_id IS 'Commerce auquel cette taxe est directement rattachee.';
COMMENT ON COLUMN taxes.montant_defaut IS 'Montant de la taxe (colonne historique renommee "montant" au niveau de l''API).';
COMMENT ON COLUMN taxes.periodicite IS 'Frequence de la taxe (colonne historique renommee "frequence" au niveau de l''API).';
COMMENT ON COLUMN taxes.commune_id IS 'Deduit automatiquement de la commune du commerce a la creation (non modifiable via le formulaire).';
