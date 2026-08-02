-- ============================================================================
-- Migration : module Creances
--
-- Une creance represente une somme due par un commerce, generee a partir
-- d'une taxe active pour une periode donnee (ex: le mois en cours pour une
-- taxe mensuelle). commerce_id est denormalise depuis taxe_id (meme
-- logique que commerces.commune_id et taxes.commune_id : evite une double
-- jointure sur la table la plus consultee de ce module).
--
-- Idempotent : "IF NOT EXISTS" partout.
-- ============================================================================

-- 1. Compteur de numerotation, un par annee (CR-2026-000001, CR-2027-000001...)
--    Table dediee plutot qu'une SEQUENCE Postgres classique : une SEQUENCE ne
--    se reinitialise pas automatiquement chaque annee, alors qu'un
--    UPSERT atomique sur cette table le fait naturellement.
CREATE TABLE IF NOT EXISTS creances_compteurs (
    annee           INTEGER PRIMARY KEY,
    dernier_numero  INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE creances_compteurs IS 'Compteur atomique pour generer les numeros de creance (CR-<annee>-<numero>), un compteur par annee.';

-- 2. Table des creances
CREATE TABLE IF NOT EXISTS creances (
    id              SERIAL PRIMARY KEY,
    numero          VARCHAR(20) NOT NULL,
    commerce_id     INTEGER NOT NULL REFERENCES commerces (id) ON DELETE RESTRICT,
    taxe_id         INTEGER NOT NULL REFERENCES taxes (id) ON DELETE RESTRICT,
    montant         DECIMAL(12,2) NOT NULL,
    date_emission   DATE NOT NULL DEFAULT CURRENT_DATE,
    date_echeance   DATE NOT NULL,
    periode_debut   DATE NOT NULL,
    periode_fin     DATE NOT NULL,
    statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_creances_numero UNIQUE (numero),

    -- Coeur de la regle metier "ne jamais generer deux creances identiques
    -- pour la meme periode" : appliquee au niveau base de donnees, pas
    -- seulement en code.
    CONSTRAINT uq_creances_taxe_periode UNIQUE (taxe_id, periode_debut, periode_fin),

    CONSTRAINT chk_creances_montant CHECK (montant >= 0),
    CONSTRAINT chk_creances_statut CHECK (statut IN ('en_attente', 'partiellement_payee', 'payee', 'annulee')),
    CONSTRAINT chk_creances_periode CHECK (periode_fin >= periode_debut),
    CONSTRAINT chk_creances_echeance CHECK (date_echeance >= date_emission)
);

COMMENT ON TABLE creances IS 'Sommes dues par un commerce, generees a partir d''une taxe pour une periode donnee.';
COMMENT ON COLUMN creances.numero IS 'Numero unique lisible, format CR-<annee>-<sequentiel sur 6 chiffres>.';
COMMENT ON COLUMN creances.commerce_id IS 'Denormalise depuis taxes.commerce_id au moment de la generation.';

CREATE INDEX IF NOT EXISTS idx_creances_commerce_id ON creances (commerce_id);
CREATE INDEX IF NOT EXISTS idx_creances_taxe_id ON creances (taxe_id);
CREATE INDEX IF NOT EXISTS idx_creances_statut ON creances (statut);
CREATE INDEX IF NOT EXISTS idx_creances_date_echeance ON creances (date_echeance);
CREATE INDEX IF NOT EXISTS idx_creances_periode ON creances (periode_debut, periode_fin);

-- Reutilise la fonction generique deja creee par une migration precedente
-- (migration-taxes.sql). CREATE OR REPLACE la redefinit a l'identique si
-- ce script est execute seul sur une base qui ne l'a pas encore.
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_creances ON creances;
CREATE TRIGGER set_updated_at_creances
    BEFORE UPDATE ON creances
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
