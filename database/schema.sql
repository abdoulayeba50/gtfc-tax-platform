-- ============================================================================
-- GTFC TAX PLATFORM — SCHEMA DE BASE DE DONNEES
-- PostgreSQL
--
-- Commune de Gueule Tapee - Fass - Colobane (GTFC)
-- Architecture prete pour le multi-tenant (plusieurs communes)
--
-- Ce fichier cree :
--   - 15 tables avec contraintes, cles etrangeres, CHECK, index
--   - Un trigger generique de mise a jour automatique de "updated_at"
--   - Les donnees initiales : roles, permissions, association role <-> permission
--
-- Execution :
--   psql -U <user> -d <database> -f database/schema.sql
-- ============================================================================


-- ============================================================================
-- SECTION 0 — FONCTION UTILITAIRE : MISE A JOUR AUTOMATIQUE DE updated_at
-- ============================================================================
-- Plutot que de gerer "updated_at" manuellement dans chaque requete UPDATE
-- cote application, un trigger PostgreSQL le fait automatiquement et de
-- maniere fiable, quelle que soit la source de la modification.

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- TABLE 1 : communes
-- Table racine du multi-tenant. Chaque commune est un tenant independant.
-- ============================================================================

CREATE TABLE communes (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(150) NOT NULL,
    code        VARCHAR(20)  NOT NULL,
    region      VARCHAR(100),
    adresse     TEXT,
    telephone   VARCHAR(20),
    email       VARCHAR(150),
    logo_url    VARCHAR(255),
    actif       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_communes_code UNIQUE (code)
);

COMMENT ON TABLE communes IS 'Tenants de la plateforme : chaque commune gere ses propres zones, agents, commerces et taxes.';
COMMENT ON COLUMN communes.code IS 'Code interne unique de la commune, ex: GTFC.';

CREATE INDEX idx_communes_actif ON communes (actif);

CREATE TRIGGER set_updated_at_communes
    BEFORE UPDATE ON communes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 2 : zones
-- Grand decoupage administratif a l'interieur d'une commune.
-- ============================================================================

CREATE TABLE zones (
    id          SERIAL PRIMARY KEY,
    commune_id  INTEGER NOT NULL,
    nom         VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_zones_commune
        FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE CASCADE,
    CONSTRAINT uq_zones_commune_nom UNIQUE (commune_id, nom)
);

COMMENT ON TABLE zones IS 'Decoupage d une commune en grandes zones (ex: Zone Nord, Zone Sud).';

CREATE INDEX idx_zones_commune_id ON zones (commune_id);

CREATE TRIGGER set_updated_at_zones
    BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 3 : quartiers
-- Decoupage fin a l'interieur d'une zone.
-- Pas de commune_id direct ici : deductible via zone_id -> zones.commune_id
-- (respect strict du 3NF).
-- ============================================================================

CREATE TABLE quartiers (
    id          SERIAL PRIMARY KEY,
    zone_id     INTEGER NOT NULL,
    nom         VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quartiers_zone
        FOREIGN KEY (zone_id) REFERENCES zones (id) ON DELETE CASCADE,
    CONSTRAINT uq_quartiers_zone_nom UNIQUE (zone_id, nom)
);

COMMENT ON TABLE quartiers IS 'Quartiers rattaches a une zone. La commune est deductible via la zone.';

CREATE INDEX idx_quartiers_zone_id ON quartiers (zone_id);

CREATE TRIGGER set_updated_at_quartiers
    BEFORE UPDATE ON quartiers
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 4 : roles
-- Table globale (non rattachee a une commune) : Super Admin, Admin Commune,
-- Superviseur, Agent Terrain. Le perimetre reel d'un utilisateur est
-- determine par utilisateurs.commune_id, pas par le role.
-- ============================================================================

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(50) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_roles_nom UNIQUE (nom)
);

COMMENT ON TABLE roles IS 'Roles globaux de la plateforme, partages par toutes les communes.';

CREATE TRIGGER set_updated_at_roles
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 5 : permissions
-- Catalogue des permissions unitaires de la plateforme (ex: commerces.read).
-- ============================================================================

CREATE TABLE permissions (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_permissions_code UNIQUE (code)
);

COMMENT ON TABLE permissions IS 'Catalogue des permissions unitaires, au format "ressource.action" (ex: commerces.read).';


-- ============================================================================
-- TABLE 6 : role_permissions
-- Table de liaison N:N entre roles et permissions.
-- ============================================================================

CREATE TABLE role_permissions (
    id            SERIAL PRIMARY KEY,
    role_id       INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Association N:N entre un role et les permissions qui lui sont accordees.';

CREATE INDEX idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);


-- ============================================================================
-- TABLE 7 : utilisateurs
-- Agents, superviseurs, administrateurs de commune, super-admins plateforme.
-- ============================================================================

CREATE TABLE utilisateurs (
    id                  SERIAL PRIMARY KEY,
    commune_id          INTEGER,
    role_id             INTEGER NOT NULL,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    email               VARCHAR(150) NOT NULL,
    telephone           VARCHAR(20),
    mot_de_passe        VARCHAR(255) NOT NULL,
    actif               BOOLEAN NOT NULL DEFAULT TRUE,
    derniere_connexion  TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_utilisateurs_commune
        FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_utilisateurs_role
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT,
    CONSTRAINT uq_utilisateurs_email UNIQUE (email)
);

COMMENT ON TABLE utilisateurs IS 'Comptes de connexion : agents, superviseurs, administrateurs de commune et super-admins.';
COMMENT ON COLUMN utilisateurs.commune_id IS 'NULL uniquement pour un super_admin plateforme non rattache a une commune specifique.';
COMMENT ON COLUMN utilisateurs.mot_de_passe IS 'Hash bcrypt du mot de passe, jamais stocke en clair.';

CREATE INDEX idx_utilisateurs_commune_id ON utilisateurs (commune_id);
CREATE INDEX idx_utilisateurs_role_id ON utilisateurs (role_id);
CREATE INDEX idx_utilisateurs_actif ON utilisateurs (actif);

CREATE TRIGGER set_updated_at_utilisateurs
    BEFORE UPDATE ON utilisateurs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 8 : sessions
-- Suit les sessions actives (tokens) pour permettre la revocation / le
-- suivi des connexions. Independante du contenu du JWT lui-meme.
-- ============================================================================

CREATE TABLE sessions (
    id               SERIAL PRIMARY KEY,
    utilisateur_id   INTEGER NOT NULL,
    token            TEXT NOT NULL,
    adresse_ip       VARCHAR(45),
    user_agent       VARCHAR(255),
    revoque          BOOLEAN NOT NULL DEFAULT FALSE,
    date_expiration  TIMESTAMP NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sessions_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
);

COMMENT ON TABLE sessions IS 'Sessions/tokens actifs des utilisateurs, pour permettre la revocation et le suivi des connexions.';

CREATE INDEX idx_sessions_utilisateur_id ON sessions (utilisateur_id);
CREATE INDEX idx_sessions_date_expiration ON sessions (date_expiration);


-- ============================================================================
-- TABLE 9 : categories_commerces
-- Categories propres a chaque commune (ex: Restaurant, Boutique, Marche).
-- ============================================================================

CREATE TABLE categories_commerces (
    id          SERIAL PRIMARY KEY,
    commune_id  INTEGER NOT NULL,
    nom         VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_categories_commerces_commune
        FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE RESTRICT,
    CONSTRAINT uq_categories_commerces_commune_nom UNIQUE (commune_id, nom)
);

COMMENT ON TABLE categories_commerces IS 'Categories de commerces, definies independamment par chaque commune.';

CREATE INDEX idx_categories_commerces_commune_id ON categories_commerces (commune_id);

CREATE TRIGGER set_updated_at_categories_commerces
    BEFORE UPDATE ON categories_commerces
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 10 : commerces
-- Fiche d'un commerce enregistre sur le terrain.
-- ============================================================================

CREATE TABLE commerces (
    id                      SERIAL PRIMARY KEY,
    commune_id              INTEGER NOT NULL,
    quartier_id             INTEGER NOT NULL,
    categorie_id            INTEGER NOT NULL,
    agent_createur_id       INTEGER,
    nom_commerce            VARCHAR(150) NOT NULL,
    nom_proprietaire        VARCHAR(150) NOT NULL,
    telephone_proprietaire  VARCHAR(20),
    adresse                 TEXT,
    latitude                DECIMAL(9,6),
    longitude               DECIMAL(9,6),
    numero_registre         VARCHAR(50),
    statut                  VARCHAR(20) NOT NULL DEFAULT 'actif',
    photo_url               VARCHAR(255),
    qr_code_uuid            VARCHAR(100) NOT NULL,
    date_enregistrement     DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_commerces_commune
        FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerces_quartier
        FOREIGN KEY (quartier_id) REFERENCES quartiers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerces_categorie
        FOREIGN KEY (categorie_id) REFERENCES categories_commerces (id) ON DELETE RESTRICT,
    CONSTRAINT fk_commerces_agent_createur
        FOREIGN KEY (agent_createur_id) REFERENCES utilisateurs (id) ON DELETE SET NULL,
    CONSTRAINT uq_commerces_qr_code UNIQUE (qr_code_uuid),
    CONSTRAINT chk_commerces_statut
        CHECK (statut IN ('actif', 'inactif', 'ferme')),
    CONSTRAINT chk_commerces_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_commerces_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

COMMENT ON TABLE commerces IS 'Commerces enregistres sur le terrain par les agents.';
COMMENT ON COLUMN commerces.commune_id IS 'Denormalisation volontaire (deductible via quartier_id) pour eviter une double jointure sur la table la plus lue de l application.';
COMMENT ON COLUMN commerces.qr_code_uuid IS 'Identifiant unique encode dans le QR code physique du commerce.';

CREATE INDEX idx_commerces_commune_id ON commerces (commune_id);
CREATE INDEX idx_commerces_quartier_id ON commerces (quartier_id);
CREATE INDEX idx_commerces_categorie_id ON commerces (categorie_id);
CREATE INDEX idx_commerces_agent_createur_id ON commerces (agent_createur_id);
CREATE INDEX idx_commerces_statut ON commerces (statut);

CREATE TRIGGER set_updated_at_commerces
    BEFORE UPDATE ON commerces
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 11 : taxes
-- Catalogue des taxes definies par une commune.
-- ============================================================================

CREATE TABLE taxes (
    id              SERIAL PRIMARY KEY,
    commune_id      INTEGER NOT NULL,
    nom             VARCHAR(150) NOT NULL,
    description     TEXT,
    montant_defaut  DECIMAL(12,2) NOT NULL,
    periodicite     VARCHAR(20) NOT NULL,
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_taxes_commune
        FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE RESTRICT,
    CONSTRAINT uq_taxes_commune_nom UNIQUE (commune_id, nom),
    CONSTRAINT chk_taxes_montant_defaut CHECK (montant_defaut >= 0),
    CONSTRAINT chk_taxes_periodicite
        CHECK (periodicite IN ('journaliere', 'mensuelle', 'trimestrielle', 'annuelle', 'unique'))
);

COMMENT ON TABLE taxes IS 'Catalogue des taxes locales definies par chaque commune.';

CREATE INDEX idx_taxes_commune_id ON taxes (commune_id);

CREATE TRIGGER set_updated_at_taxes
    BEFORE UPDATE ON taxes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 12 : commerce_taxes
-- Table de liaison N:N entre commerces et taxes, avec attributs propres
-- a l'assujettissement (montant personnalise, date d'effet).
-- ============================================================================

CREATE TABLE commerce_taxes (
    id                      SERIAL PRIMARY KEY,
    commerce_id             INTEGER NOT NULL,
    taxe_id                 INTEGER NOT NULL,
    montant_personnalise    DECIMAL(12,2),
    date_assujettissement   DATE NOT NULL DEFAULT CURRENT_DATE,
    actif                   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_commerce_taxes_commerce
        FOREIGN KEY (commerce_id) REFERENCES commerces (id) ON DELETE CASCADE,
    CONSTRAINT fk_commerce_taxes_taxe
        FOREIGN KEY (taxe_id) REFERENCES taxes (id) ON DELETE RESTRICT,
    CONSTRAINT uq_commerce_taxes UNIQUE (commerce_id, taxe_id),
    CONSTRAINT chk_commerce_taxes_montant
        CHECK (montant_personnalise IS NULL OR montant_personnalise >= 0)
);

COMMENT ON TABLE commerce_taxes IS 'Assujettissement d un commerce a une taxe : quelles taxes s appliquent a quel commerce, avec quel montant.';
COMMENT ON COLUMN commerce_taxes.montant_personnalise IS 'Surcharge taxes.montant_defaut si renseigne, sinon le montant par defaut de la taxe s applique.';

CREATE INDEX idx_commerce_taxes_commerce_id ON commerce_taxes (commerce_id);
CREATE INDEX idx_commerce_taxes_taxe_id ON commerce_taxes (taxe_id);

CREATE TRIGGER set_updated_at_commerce_taxes
    BEFORE UPDATE ON commerce_taxes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 13 : paiements
-- Chaque paiement effectue par un commerce pour une taxe donnee, collecte
-- par un agent. Prepare pour l'integration Wave via reference_transaction.
-- ============================================================================

CREATE TABLE paiements (
    id                      SERIAL PRIMARY KEY,
    commerce_taxe_id        INTEGER NOT NULL,
    agent_id                INTEGER NOT NULL,
    montant                 DECIMAL(12,2) NOT NULL,
    mode_paiement           VARCHAR(20) NOT NULL,
    reference_transaction   VARCHAR(100),
    periode_debut           DATE NOT NULL,
    periode_fin             DATE NOT NULL,
    statut                  VARCHAR(20) NOT NULL DEFAULT 'valide',
    date_paiement           TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_paiements_commerce_taxe
        FOREIGN KEY (commerce_taxe_id) REFERENCES commerce_taxes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_paiements_agent
        FOREIGN KEY (agent_id) REFERENCES utilisateurs (id) ON DELETE RESTRICT,
    CONSTRAINT chk_paiements_montant CHECK (montant > 0),
    CONSTRAINT chk_paiements_periode CHECK (periode_fin >= periode_debut),
    CONSTRAINT chk_paiements_mode
        CHECK (mode_paiement IN ('especes', 'wave', 'orange_money', 'virement')),
    CONSTRAINT chk_paiements_statut
        CHECK (statut IN ('en_attente', 'valide', 'rejete', 'rembourse'))
);

COMMENT ON TABLE paiements IS 'Historique des paiements de taxes collectes aupres des commerces.';
COMMENT ON COLUMN paiements.reference_transaction IS 'Identifiant de transaction mobile money (ex: Wave), utile pour la reconciliation.';

CREATE INDEX idx_paiements_commerce_taxe_id ON paiements (commerce_taxe_id);
CREATE INDEX idx_paiements_agent_id ON paiements (agent_id);
CREATE INDEX idx_paiements_date_paiement ON paiements (date_paiement);
CREATE INDEX idx_paiements_statut ON paiements (statut);
CREATE INDEX idx_paiements_reference_transaction ON paiements (reference_transaction);

CREATE TRIGGER set_updated_at_paiements
    BEFORE UPDATE ON paiements
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TABLE 14 : journal_audit
-- Tracabilite des actions sensibles. Table append-only : jamais modifiee
-- apres insertion, donc pas de updated_at ni de trigger associe.
-- ============================================================================

CREATE TABLE journal_audit (
    id                  SERIAL PRIMARY KEY,
    utilisateur_id      INTEGER,
    action              VARCHAR(50) NOT NULL,
    table_cible         VARCHAR(50) NOT NULL,
    enregistrement_id   INTEGER,
    anciennes_valeurs   JSONB,
    nouvelles_valeurs   JSONB,
    adresse_ip          VARCHAR(45),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_journal_audit_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE SET NULL
);

COMMENT ON TABLE journal_audit IS 'Journal d audit append-only : trace toutes les actions sensibles (creation, modification, suppression, connexion).';
COMMENT ON COLUMN journal_audit.utilisateur_id IS 'NULL si l action est declenchee par le systeme plutot que par un utilisateur.';

CREATE INDEX idx_journal_audit_utilisateur_id ON journal_audit (utilisateur_id);
CREATE INDEX idx_journal_audit_table_cible ON journal_audit (table_cible);
CREATE INDEX idx_journal_audit_created_at ON journal_audit (created_at);
CREATE INDEX idx_journal_audit_table_enregistrement ON journal_audit (table_cible, enregistrement_id);


-- ============================================================================
-- TABLE 15 : parametres
-- Parametres de configuration cle/valeur, globaux (commune_id NULL) ou
-- specifiques a une commune.
-- ============================================================================

CREATE TABLE parametres (
    id          SERIAL PRIMARY KEY,
    commune_id  INTEGER,
    cle         VARCHAR(100) NOT NULL,
    valeur      TEXT,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_parametres_commune
        FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE CASCADE
);

COMMENT ON TABLE parametres IS 'Parametres de configuration cle/valeur. commune_id NULL = parametre global plateforme.';

-- NULL n'est jamais egal a NULL en SQL, donc une contrainte UNIQUE(commune_id, cle)
-- classique n'empecherait pas les doublons de cle globale (commune_id NULL).
-- On utilise donc deux index uniques partiels distincts.
CREATE UNIQUE INDEX uq_parametres_globaux ON parametres (cle) WHERE commune_id IS NULL;
CREATE UNIQUE INDEX uq_parametres_commune ON parametres (commune_id, cle) WHERE commune_id IS NOT NULL;
CREATE INDEX idx_parametres_commune_id ON parametres (commune_id);

CREATE TRIGGER set_updated_at_parametres
    BEFORE UPDATE ON parametres
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- DONNEES INITIALES — ROLES
-- ============================================================================

INSERT INTO roles (nom, description) VALUES
    ('Super Admin',    'Acces total a la plateforme, toutes communes confondues.'),
    ('Admin Commune',  'Administre une commune : agents, commerces, taxes, paiements.'),
    ('Superviseur',    'Supervise les commerces et paiements d une commune, en lecture et gestion.'),
    ('Agent Terrain',  'Enregistre des commerces et collecte des paiements sur le terrain.');


-- ============================================================================
-- DONNEES INITIALES — PERMISSIONS
-- ============================================================================

INSERT INTO permissions (code, description) VALUES
    ('communes.read',      'Consulter les communes'),
    ('communes.create',    'Creer une commune'),
    ('communes.update',    'Modifier une commune'),
    ('communes.delete',    'Supprimer une commune'),

    ('utilisateurs.read',   'Consulter les utilisateurs'),
    ('utilisateurs.create', 'Creer un utilisateur'),
    ('utilisateurs.update', 'Modifier un utilisateur'),
    ('utilisateurs.delete', 'Supprimer un utilisateur'),

    ('commerces.read',   'Consulter les commerces'),
    ('commerces.create', 'Creer un commerce'),
    ('commerces.update', 'Modifier un commerce'),
    ('commerces.delete', 'Supprimer un commerce'),

    ('taxes.read',   'Consulter les taxes'),
    ('taxes.create', 'Creer une taxe'),
    ('taxes.update', 'Modifier une taxe'),
    ('taxes.delete', 'Supprimer une taxe'),

    ('paiements.read',   'Consulter les paiements'),
    ('paiements.create', 'Enregistrer un paiement'),
    ('paiements.update', 'Modifier un paiement'),
    ('paiements.delete', 'Supprimer un paiement'),

    ('dashboard.read', 'Consulter le tableau de bord et les statistiques');


-- ============================================================================
-- DONNEES INITIALES — ASSOCIATION ROLES <-> PERMISSIONS
-- Ecrit via sous-requetes (par nom de role / code de permission) plutot que
-- par ID en dur : robuste face a un ordre d'insertion different.
-- ============================================================================

-- Super Admin : absolument toutes les permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.nom = 'Super Admin';

-- Admin Commune : toutes les permissions SAUF la creation/suppression de
-- communes (actions reservees au Super Admin, qui gere l'onboarding des
-- communes sur la plateforme).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.nom = 'Admin Commune'
  AND p.code NOT IN ('communes.create', 'communes.delete');

-- Superviseur : lecture et gestion (lecture + modification) des commerces
-- et des paiements, plus le tableau de bord.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.nom = 'Superviseur'
  AND p.code IN (
      'commerces.read', 'commerces.update',
      'paiements.read', 'paiements.update',
      'dashboard.read'
  );

-- Agent Terrain : creation de commerces, consultation des commerces,
-- enregistrement de paiements. Rien d'autre.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.nom = 'Agent Terrain'
  AND p.code IN (
      'commerces.create', 'commerces.read',
      'paiements.create'
  );


-- ============================================================================
-- FIN DU SCHEMA
-- ============================================================================
