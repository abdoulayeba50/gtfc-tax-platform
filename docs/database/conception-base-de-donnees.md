# GTFC Tax Platform — Conception de la base de données

Base PostgreSQL, normalisée en 3NF. Clés primaires en `SERIAL` pour cette v1.
Aucun script SQL ici — conception uniquement.

---

## 1. `communes`

Table racine du multi-tenant. Chaque commune est un tenant indépendant.

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| nom | VARCHAR(150) | NOT NULL |
| code | VARCHAR(20) | NOT NULL, UNIQUE — code interne (ex: `GTFC`) |
| region | VARCHAR(100) | |
| adresse | TEXT | |
| telephone | VARCHAR(20) | |
| email | VARCHAR(150) | |
| logo_url | VARCHAR(255) | |
| actif | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : aucune (table racine)
- **Contraintes** : `code` unique (utilisé pour identifier la commune dans les URL/API si besoin)
- **Index recommandés** : index unique sur `code` (déjà couvert par UNIQUE), index sur `actif`

---

## 2. `zones`

Grand découpage administratif à l'intérieur d'une commune (ex: Zone Nord, Zone Sud).

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| commune_id | INTEGER | NOT NULL, FK → communes(id) |
| nom | VARCHAR(100) | NOT NULL |
| description | TEXT | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `commune_id` → `communes(id)`
- **Contraintes** : UNIQUE(`commune_id`, `nom`) — pas deux zones de même nom dans une commune
- **Index recommandés** : index sur `commune_id`, index unique composite (`commune_id`, `nom`)

---

## 3. `quartiers`

Découpage fin à l'intérieur d'une zone. Rattaché à `zones` uniquement (pas de `commune_id` direct : redondant, dérivable via `zone_id → zones.commune_id` — respect strict du 3NF ici).

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| zone_id | INTEGER | NOT NULL, FK → zones(id) |
| nom | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `zone_id` → `zones(id)`
- **Contraintes** : UNIQUE(`zone_id`, `nom`)
- **Index recommandés** : index sur `zone_id`, index unique composite (`zone_id`, `nom`)

---

## 4. `roles`

Table globale, **non rattachée à une commune**. Les rôles (super_admin, admin_commune, superviseur, agent_terrain...) sont définis au niveau plateforme pour rester cohérents entre toutes les communes ; c'est `utilisateurs.commune_id` qui détermine le périmètre réel d'un utilisateur.

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| nom | VARCHAR(50) | NOT NULL, UNIQUE |
| description | TEXT | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : aucune
- **Contraintes** : `nom` unique
- **Index recommandés** : index unique sur `nom`

---

## 5. `utilisateurs`

Agents, superviseurs, administrateurs de commune, super-admins plateforme.

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| commune_id | INTEGER | NULLABLE, FK → communes(id) — NULL uniquement pour un super_admin plateforme |
| role_id | INTEGER | NOT NULL, FK → roles(id) |
| nom | VARCHAR(100) | NOT NULL |
| prenom | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | NOT NULL, UNIQUE |
| telephone | VARCHAR(20) | |
| mot_de_passe | VARCHAR(255) | NOT NULL — hash bcrypt |
| actif | BOOLEAN | NOT NULL, DEFAULT true |
| derniere_connexion | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `commune_id` → `communes(id)` (nullable), `role_id` → `roles(id)`
- **Contraintes** : `email` unique et NOT NULL
- **Index recommandés** : index unique sur `email` (lookup au login), index sur `commune_id`, index sur `role_id`, index sur `actif`

---

## 6. `categories_commerces`

Catégories propres à chaque commune (ex: Restaurant, Boutique, Marché, Atelier). Rattachées à une commune plutôt que globales, car la nomenclature fiscale peut varier d'une commune à l'autre.

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| commune_id | INTEGER | NOT NULL, FK → communes(id) |
| nom | VARCHAR(100) | NOT NULL |
| description | TEXT | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `commune_id` → `communes(id)`
- **Contraintes** : UNIQUE(`commune_id`, `nom`)
- **Index recommandés** : index sur `commune_id`, index unique composite (`commune_id`, `nom`)

---

## 7. `commerces`

Fiche d'un commerce enregistré sur le terrain.

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| commune_id | INTEGER | NOT NULL, FK → communes(id) *(voir note dénormalisation ci-dessous)* |
| quartier_id | INTEGER | NOT NULL, FK → quartiers(id) |
| categorie_id | INTEGER | NOT NULL, FK → categories_commerces(id) |
| agent_createur_id | INTEGER | NULLABLE, FK → utilisateurs(id) |
| nom_commerce | VARCHAR(150) | NOT NULL |
| nom_proprietaire | VARCHAR(150) | NOT NULL |
| telephone_proprietaire | VARCHAR(20) | |
| adresse | TEXT | |
| latitude | DECIMAL(9,6) | |
| longitude | DECIMAL(9,6) | |
| numero_registre | VARCHAR(50) | NULLABLE — RCCM/NINEA si disponible |
| statut | VARCHAR(20) | NOT NULL, DEFAULT 'actif' — CHECK IN ('actif','inactif','ferme') |
| photo_url | VARCHAR(255) | |
| qr_code_uuid | VARCHAR(100) | NOT NULL, UNIQUE — identifiant encodé dans le QR code |
| date_enregistrement | DATE | NOT NULL, DEFAULT current_date |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `commune_id` → `communes(id)`, `quartier_id` → `quartiers(id)`, `categorie_id` → `categories_commerces(id)`, `agent_createur_id` → `utilisateurs(id)`
- **Contraintes** : `qr_code_uuid` unique, CHECK sur `statut`
- **Index recommandés** : index sur `commune_id`, `quartier_id`, `categorie_id`, `agent_createur_id`, index unique sur `qr_code_uuid`, index sur `statut`

> **Note sur `commune_id`** : cette colonne est techniquement dérivable via `quartier_id → zones.commune_id`, donc redondante au sens strict du 3NF. C'est une **dénormalisation volontaire et documentée** : `commerces` est la table la plus lue de toute l'application (filtrage systématique par commune sur le dashboard, les stats, la carte). Éviter une double jointure sur chaque requête est un vrai gain de performance. En contrepartie, l'application (au niveau service) devra garantir que `commune_id` reste cohérent avec `quartier_id` à la création/modification.

---

## 8. `taxes`

Catalogue des taxes définies par une commune.

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| commune_id | INTEGER | NOT NULL, FK → communes(id) |
| nom | VARCHAR(150) | NOT NULL |
| description | TEXT | |
| montant_defaut | DECIMAL(12,2) | NOT NULL, CHECK (montant_defaut >= 0) |
| periodicite | VARCHAR(20) | NOT NULL — CHECK IN ('journaliere','mensuelle','trimestrielle','annuelle','unique') |
| actif | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `commune_id` → `communes(id)`
- **Contraintes** : UNIQUE(`commune_id`, `nom`), CHECK sur `periodicite`, CHECK montant ≥ 0
- **Index recommandés** : index sur `commune_id`, index unique composite (`commune_id`, `nom`)

---

## 9. `commerce_taxes`

Table de liaison **N:N** entre `commerces` et `taxes`, avec attributs propres à l'assujettissement (un commerce peut être soumis à plusieurs taxes, une taxe peut concerner plusieurs commerces).

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| commerce_id | INTEGER | NOT NULL, FK → commerces(id) |
| taxe_id | INTEGER | NOT NULL, FK → taxes(id) |
| montant_personnalise | DECIMAL(12,2) | NULLABLE — surcharge `taxes.montant_defaut` si renseigné |
| date_assujettissement | DATE | NOT NULL, DEFAULT current_date |
| actif | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `commerce_id` → `commerces(id)`, `taxe_id` → `taxes(id)`
- **Contraintes** : UNIQUE(`commerce_id`, `taxe_id`) — un commerce n'est assujetti qu'une seule fois à une même taxe
- **Index recommandés** : index sur `commerce_id`, index sur `taxe_id`, index unique composite (`commerce_id`, `taxe_id`)

---

## 10. `paiements`

Chaque paiement effectué par un commerce pour une taxe donnée, collecté par un agent.

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| commerce_taxe_id | INTEGER | NOT NULL, FK → commerce_taxes(id) |
| agent_id | INTEGER | NOT NULL, FK → utilisateurs(id) |
| montant | DECIMAL(12,2) | NOT NULL, CHECK (montant > 0) |
| mode_paiement | VARCHAR(20) | NOT NULL — CHECK IN ('especes','wave','orange_money','virement') |
| reference_transaction | VARCHAR(100) | NULLABLE — id transaction Wave/mobile money |
| periode_debut | DATE | NOT NULL |
| periode_fin | DATE | NOT NULL, CHECK (periode_fin >= periode_debut) |
| statut | VARCHAR(20) | NOT NULL, DEFAULT 'valide' — CHECK IN ('en_attente','valide','rejete','rembourse') |
| date_paiement | TIMESTAMP | NOT NULL, DEFAULT now() |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `commerce_taxe_id` → `commerce_taxes(id)`, `agent_id` → `utilisateurs(id)`
- **Contraintes** : montant > 0, CHECK sur `mode_paiement`, CHECK sur `statut`, CHECK période cohérente
- **Index recommandés** : index sur `commerce_taxe_id`, index sur `agent_id`, index sur `date_paiement` (rapports par période), index sur `statut`, index sur `reference_transaction` (recherche transaction Wave)

---

## 11. `journal_audit`

Traçabilité de toutes les actions sensibles (création/modification/suppression, connexions). Table **append-only** — jamais modifiée après insertion, donc pas d'`updated_at`.

| Colonne | Type | Contraintes |
|---|---|---|
| id | SERIAL | PK |
| utilisateur_id | INTEGER | NULLABLE, FK → utilisateurs(id) — NULL si action système |
| action | VARCHAR(50) | NOT NULL — ex: CREATE, UPDATE, DELETE, LOGIN |
| table_cible | VARCHAR(50) | NOT NULL — nom de la table affectée |
| enregistrement_id | INTEGER | NULLABLE — id de la ligne affectée |
| anciennes_valeurs | JSONB | NULLABLE |
| nouvelles_valeurs | JSONB | NULLABLE |
| adresse_ip | VARCHAR(45) | NULLABLE |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() |

- **PK** : `id`
- **FK** : `utilisateur_id` → `utilisateurs(id)` (nullable)
- **Contraintes** : `action` et `table_cible` NOT NULL
- **Index recommandés** : index sur `utilisateur_id`, index sur `table_cible`, index sur `created_at`, index composite (`table_cible`, `enregistrement_id`) pour retrouver l'historique d'un enregistrement précis

---

## Relations entre les tables

| Relation | Cardinalité | Détail |
|---|---|---|
| communes → zones | 1:N | Une commune a plusieurs zones |
| zones → quartiers | 1:N | Une zone a plusieurs quartiers |
| communes → utilisateurs | 1:N (0:N) | Une commune a plusieurs utilisateurs ; nullable pour un super_admin plateforme |
| roles → utilisateurs | 1:N | Un rôle est partagé par plusieurs utilisateurs, sur toutes les communes |
| communes → categories_commerces | 1:N | Chaque commune définit ses propres catégories |
| communes → commerces | 1:N | Dénormalisation assumée (voir note table 7) |
| quartiers → commerces | 1:N | Un quartier contient plusieurs commerces |
| categories_commerces → commerces | 1:N | Une catégorie regroupe plusieurs commerces |
| utilisateurs → commerces | 1:N (0:N) | Un agent a enregistré plusieurs commerces (`agent_createur_id`, nullable) |
| communes → taxes | 1:N | Chaque commune définit son propre catalogue de taxes |
| commerces ↔ taxes | N:N via `commerce_taxes` | Un commerce peut être soumis à plusieurs taxes, une taxe s'applique à plusieurs commerces |
| commerce_taxes → paiements | 1:N | Un assujettissement donne lieu à plusieurs paiements (un par période) |
| utilisateurs → paiements | 1:N | Un agent (`agent_id`) collecte plusieurs paiements |
| utilisateurs → journal_audit | 1:N (0:N) | Un utilisateur génère plusieurs entrées de log ; nullable si action système |

---

## Diagramme relationnel (ERD ASCII)

```
                                   ┌───────────────┐
                                   │   communes    │
                                   │───────────────│
                                   │ id PK         │
                                   │ nom           │
                                   │ code (UQ)     │
                                   └───────┬───────┘
                                           │ 1
                 ┌─────────────────────────┼─────────────────────────┬─────────────────────┐
                 │N                        │N                        │N                    │N
        ┌────────▼────────┐      ┌─────────▼─────────┐    ┌──────────▼──────────┐  ┌────────▼────────┐
        │      zones       │      │    utilisateurs    │    │ categories_commerces │  │      taxes      │
        │──────────────────│      │─────────────────────│    │──────────────────────│  │─────────────────│
        │ id PK            │      │ id PK               │    │ id PK                │  │ id PK           │
        │ commune_id FK    │      │ commune_id FK (null) │    │ commune_id FK        │  │ commune_id FK   │
        │ nom              │      │ role_id FK ─────┐    │    │ nom                  │  │ nom             │
        └────────┬─────────┘      │ email (UQ)      │    │    └──────────┬───────────┘  │ montant_defaut  │
                  │1               │ mot_de_passe    │    │               │N              │ periodicite     │
                  │N               └────────┬────────┘    │               │               └────────┬────────┘
        ┌─────────▼─────────┐               │N            │               │                        │N
        │     quartiers      │               │             │               │                        │
        │────────────────────│               │             │               │                        │
        │ id PK              │               │             │               │                        │
        │ zone_id FK         │               │             │               │                        │
        │ nom                │               │             │               │                        │
        └─────────┬──────────┘               │             │               │                        │
                  │1                          │             │               │                        │
                  │N                          │ (agent_createur_id, nullable)                        │
        ┌─────────▼──────────────────────────▼─────────────▼───────────────┘                        │
        │                              commerces                                                      │
        │───────────────────────────────────────────────────────────────────                          │
        │ id PK                                                                                         │
        │ commune_id FK  (dénormalisé, cf. note)                                                        │
        │ quartier_id FK                                                                                │
        │ categorie_id FK                                                                               │
        │ agent_createur_id FK (nullable) ──► utilisateurs                                              │
        │ qr_code_uuid (UQ)                                                                              │
        │ statut                                                                                        │
        └──────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                            │1
                                            │N
                                 ┌──────────▼──────────┐
                                 │   commerce_taxes      │◄───────────────────────────────┐
                                 │ (table de liaison N:N)│                                 │N
                                 │───────────────────────│                                 │
                                 │ id PK                 │                                 │
                                 │ commerce_id FK        │                                 │
                                 │ taxe_id FK ────────────────────────────────────────────►┘
                                 │ montant_personnalise  │
                                 │ UQ(commerce_id,taxe_id)│
                                 └──────────┬─────────────┘
                                            │1
                                            │N
                                 ┌──────────▼──────────┐          ┌──────────────────┐
                                 │      paiements        │◄──N────┤   utilisateurs     │
                                 │────────────────────────│        │ (agent_id)         │
                                 │ id PK                  │        └──────────────────┘
                                 │ commerce_taxe_id FK     │
                                 │ agent_id FK             │
                                 │ montant                 │
                                 │ mode_paiement            │
                                 │ statut                   │
                                 └──────────────────────────┘


        ┌──────────────────┐              ┌───────────────────────┐
        │      roles         │──1────N───►│      utilisateurs        │──1────N───►│  journal_audit  │
        │─────────────────────│              │───────────────────────────│             (nullable)
        │ id PK               │              │ id PK, role_id FK          │
        │ nom (UQ)            │              └───────────────────────────┘
        └────────────────────┘
```

**Légende** : `1` = extrémité "un", `N` = extrémité "plusieurs", `UQ` = contrainte unique, `PK` = clé primaire, `FK` = clé étrangère.
