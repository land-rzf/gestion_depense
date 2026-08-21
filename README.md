# Dépenses Manager

**Dépenses Manager** est une application Next.js de suivi de dépenses personnelles. Elle associe une interface responsive en Tailwind CSS, des visualisations Recharts et un stockage isolé par utilisateur dans Upstash Redis. L’authentification repose sur NextAuth avec un fournisseur d’identifiants, des sessions JWT et des mots de passe hachés par bcrypt. Tous les montants de l’interface sont affichés et saisis en **ariary malgache (MGA)**.

## Fonctionnalités

| Domaine | Implémentation |
|---|---|
| Comptes | Inscription, connexion, déconnexion et session JWT persistante. |
| Données | Isolation stricte grâce à un identifiant utilisateur vérifié sur chaque opération. |
| Dépenses | Création, lecture filtrée, modification et suppression. |
| Tableau de bord | Total mensuel, cinq dernières dépenses, camembert par catégorie et évolution sur six mois. |
| Expérience | Design mobile-first, modal de saisie, états de chargement et thème clair/sombre. |
| Fiabilité | Validation serveur Zod, messages d’erreur explicites et test automatisé des schémas. |

## Prérequis

Utilisez **Node.js 18.17 ou une version plus récente**, ainsi qu’un compte gratuit [Upstash](https://upstash.com/) et une base Redis REST. Créez une base dans le tableau de bord Upstash, puis relevez son URL REST et son jeton REST. Ces deux valeurs sont utilisées exclusivement côté serveur.

> Ne versionnez jamais `.env.local`. Ce fichier contient vos jetons et secrets d’environnement.

## Installation locale

Dupliquez d’abord le fichier de configuration, puis remplissez chacune des valeurs.

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Voici la description des variables attendues.

| Variable | Rôle |
|---|---|
| `UPSTASH_REDIS_REST_URL` | URL REST de la base Redis Upstash. |
| `UPSTASH_REDIS_REST_TOKEN` | Jeton REST privé de la base Upstash. |
| `NEXTAUTH_SECRET` | Secret long et aléatoire servant à signer les JWT NextAuth. Générez-le, par exemple, avec `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Adresse publique de l’application. Conservez `http://localhost:3000` en développement. |

L’application est ensuite disponible sur [http://localhost:3000](http://localhost:3000). Créez un compte, connectez-vous et ajoutez une première dépense afin d’alimenter le tableau de bord.

## Modèle de données Redis

Le projet applique la convention de clés suivante. Elle permet une recherche rapide du compte, une collection de dépenses par utilisateur et un cache de total par mois.

```text
user:{userId}                    -> hash { email, passwordHash, name, createdAt }
user:email:{email}               -> string { userId }
user:{userId}:expenses           -> set { expenseId, ... }
expense:{expenseId}              -> hash { userId, amount, category, description, date, createdAt }
user:{userId}:total:{yyyy-mm}    -> string { total mensuel }
```

Lors d’une création, d’une modification ou d’une suppression, le total du mois concerné est recalculé. Les opérations `PUT` et `DELETE` vérifient systématiquement que la dépense demandée appartient à la session active avant toute écriture.

## Endpoints

| Méthode | Chemin | Protection |
|---|---|---|
| `POST` | `/api/auth/register` | Public — crée un compte après validation et hachage. |
| `GET` / `POST` | `/api/auth/[...nextauth]` | NextAuth — session, connexion et déconnexion. |
| `GET` / `POST` | `/api/expenses` | Session requise — filtre facultatif `month` et `category`. |
| `PUT` / `DELETE` | `/api/expenses/:id` | Session requise — propriété de la dépense contrôlée côté serveur. |
| `GET` | `/api/dashboard/summary` | Session requise — données agrégées du tableau de bord. |

## Vérifications

Exécutez la compilation de production avant toute mise en ligne.

```bash
npm run build
```

## Déploiement sur Vercel

Créez un dépôt Git, poussez ce dossier sur GitHub, puis importez le dépôt dans [Vercel](https://vercel.com/new). Vercel détecte automatiquement Next.js via `vercel.json`. Dans **Settings → Environment Variables**, ajoutez les quatre variables listées dans `.env.local.example`. En production, remplacez `NEXTAUTH_URL` par l’URL HTTPS finale de votre projet Vercel avant de déployer.

Les fichiers de référence ci-dessous peuvent aider à configurer les services externes : [documentation NextAuth](https://next-auth.js.org/configuration/options), [documentation Upstash Redis](https://upstash.com/docs/redis/overall/getstarted) et [guide de déploiement Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs).

## Notes de sécurité

Les mots de passe sont hachés avec bcrypt et ne sont jamais écrits en clair. Les validations Zod sont exécutées dans les routes d’API, indépendamment de l’interface utilisateur. Ne donnez jamais au navigateur les variables `UPSTASH_REDIS_REST_TOKEN` ou `NEXTAUTH_SECRET`.
