-- ============================================================================
-- Migration : ajoute la colonne numero_ninea a la table commerces
--
-- Le champ "Numero NINEA" est demande par le module Commerces mais n'existait
-- pas dans le schema.sql initial (seul numero_registre y figurait). Cette
-- migration est idempotente : "IF NOT EXISTS" evite toute erreur si elle est
-- executee plusieurs fois ou sur une base qui l'a deja.
-- ============================================================================

ALTER TABLE commerces ADD COLUMN IF NOT EXISTS numero_ninea VARCHAR(50);

COMMENT ON COLUMN commerces.numero_ninea IS 'Numero d''identification fiscale NINEA, optionnel.';
