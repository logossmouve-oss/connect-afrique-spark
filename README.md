# Connect Afrique

1. Concept et positionnement

Nom : MonWé (signifie « mon nous / mon lien » selon ton storytelling).

Concept : plateforme de rencontres amoureuses, amicales et professionnelles pour l’Afrique et la diaspora, avec option d’anonymat (pseudo, code) comme le fait déjà MONWÉ pour les rencontres anonymes encadrées.facebook+1

Différence : mélange d’app de dating panafricaine type Wazz241 + concept d’identité invisible (interaction via pseudo/code avant de dévoiler sa vraie identité).wazz241+1

2. Public cible

Jeunes adultes africains (18–40 ans) sur le continent.

Diaspora africaine en Europe (France, Belgique, Pays‑Bas, etc.) et ailleurs.

Profils cherchant :

relations sérieuses ou amicales,

réseautage (projets, business),

rencontres plus « safe » grâce à l’anonymat contrôlé.monwe

3. Fonctionnalités principales

Inscription / connexion :

par email, téléphone et éventuellement Google/Apple,

vérification SMS obligatoire pour limiter les faux comptes.wazz241

Profil :

pseudo obligatoire (affiché en premier),

nom réel facultatif et caché jusqu’à décision de l’utilisateur,

photo de profil, bio, centres d’intérêt, pays, ville, statut (amour, amitié, pro).

Système d’anonymat « MonWé » :

chaque utilisateur reçoit un « code MonWé » (ex : MW‑1234) pour être identifié sans dévoiler son nom, comme le concept d’identité invisible de MONWÉ.facebook+1

possibilité de chatter uniquement sous ce code, puis de « révéler » son profil complet si les deux acceptent.

Matching :

suggestions basées sur pays, ville, âge, centres d’intérêt,

mode swipe ou liste,

filtres : type de relation (amour, amitié, pro), distance, langue.

Chat / messagerie :

chat temps réel,

envoi de textes, emojis, éventuellement images (modérées),

étapes :

chat anonyme via code MonWé,

révélation progressive (photo, nom, réseaux sociaux) si les deux sont d’accord.

4. Modèle économique

Freemium :

gratuit : inscription, profil, nombre limité de likes et de chats simultanés.

premium :

likes illimités,

filtres avancés (profession, type de relation, niveau d’étude),

voir qui t’a liké,

boost de profil.

Paiement :

Mobile Money (Afrique) + carte bancaire (diaspora), dans la lignée de ce que font les apps africaines modernes et Wazz241.play.google+1

abonnement mensuel, trimestriel et annuel à petit prix.

5. Plateforme technique

PWA (application web progressive) :

installable depuis le navigateur, comme Wazz241 (sans App Store / Play Store).wazz241

optimisée pour réseaux faibles (compression images, cache).

Évolutions :

plus tard, app Android (wrapper de la PWA ou app native),

éventuellement app iOS selon budget.

6. UX / UI

Identité visuelle :

couleurs chaudes africaines (orange, rouge, ocre, vert),

logo avec « MonWé » lisible, évoquant le lien, la communauté.

Parcours utilisateur :

Onboarding simple (3–4 écrans) expliquant le concept MonWé : anonymat, code, sécurité.

Création de profil (pseudo + code MonWé généré automatiquement).

Choix des objectifs (amour, amitié, pro).

Accès aux recommandations et au chat.

Accessibilité :

interface pensée pour smartphones low‑cost,

texte lisible, actions simples (grands boutons, peu de texte par écran).

7. Sécurité, anonymat et modération

Vérification :

SMS pour créer un compte,

option de vérification photo pour badge « profil vérifié » (photo de soi avec geste spécifique).

Anonymat :

pas obligatoire d’afficher son nom réel,

contrôle sur ce qui est visible (photo floutée ou non, mention du pays uniquement, etc.) inspiré du principe d’anonymat total de MONWÉ.monwe

Modération :

système de signalement pour profils et messages,

blocage d’utilisateur,

back‑office modérateurs :

voir les comptes signalés,

bannir, suspendre, supprimer.

8. Architecture technique (résumé)

Frontend :

framework type React / Vue / Next, PWA ready.

Backend :

API REST ou GraphQL (Node.js, Django, Laravel…),

base de données relationnelle (PostgreSQL ou MySQL),

stockage d’images sur un service type S3/MinIO.

Temps réel :

WebSockets ou bibliothèque type Socket.io pour la messagerie.

Infrastructure :

hébergement cloud (ex : VPS ou service managé),

logs et monitoring basiques (erreurs, lenteurs, pics d’usage).

9. Back‑office MonWé

Tableau de bord :

nombre d’inscrits, pays, croissance par mois,

nombre de matchs, conversations, taux de conversion Free → Premium.

Gestion utilisateurs :

recherche par pseudo, code MonWé, téléphone, email,

actions : suspendre, bannir, restaurer.

Contenu :

gestion des signalements,

statistiques sur les abus (insultes, scams, spam).

10. Roadmap MonWé (exemple)

Phase 1 (MVP, 3–4 mois) :

PWA, inscription, profil, code MonWé, matching simple, chat de base, Mobile Money dans 1–2 pays.

Phase 2 (6–8 mois) :

premium, boost, filtres avancés, vérification photo, modération complète.

Phase 3 :

features communautaires (salons par pays, events),

app Android, campagne marketing Afrique + diaspora.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ecc3e0f0-dd0e-4a79-91c2-66a24d1f6971).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
