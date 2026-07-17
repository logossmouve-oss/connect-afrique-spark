# Plan MVP — MonWé

Plateforme panafricaine de rencontres (amour / amitié / pro) avec anonymat via « code MonWé ». Ce plan couvre un **MVP livrable** dans ce projet Lovable (Phase 1 de ta roadmap). Le premium, la modération avancée, Mobile Money, l'app Android et les features communautaires viendront ensuite.

## Ce qu'on construit maintenant (MVP)

1. **Identité visuelle & design system**
   - Palette chaude africaine (orange, ocre, rouge, vert profond) en tokens `oklch` dans `src/styles.css`.
   - Typo distinctive (display + body), pas les polices AI génériques.
   - Composants shadcn stylés via variants (bouton hero, badges de statut amour/amitié/pro).

2. **Landing publique** (`/`)
   - Hero « MonWé — Rencontre. Anonymement. Vraiment. »
   - Explication du code MonWé (MW-XXXX) et de la révélation progressive.
   - Sections : 3 objectifs (amour / amitié / pro), comment ça marche, sécurité & anonymat, CTA inscription.
   - SEO complet (title, description, og, twitter) + `sitemap.xml` + `robots.txt`.

3. **Auth (Lovable Cloud)**
   - Email + mot de passe et Google.
   - Pas de vérification SMS au MVP (nécessite Twilio payant — on ajoute en Phase 2 si tu veux).
   - Table `profiles` liée à `auth.users` (trigger auto-création), RLS stricte.
   - Reset password + `/reset-password`.

4. **Onboarding (3 écrans)**
   - Écran 1 : concept MonWé + code anonyme.
   - Écran 2 : choix pseudo (obligatoire) + génération auto du code `MW-XXXX` unique.
   - Écran 3 : objectifs (amour / amitié / pro, multi-sélect), pays, ville, langue, âge, bio, intérêts.

5. **Profil utilisateur**
   - Vue publique : pseudo + code MonWé + photo (floutable) + pays/ville + intérêts + statut.
   - Nom réel, email, téléphone : **cachés par défaut**, révélés par action explicite dans un chat.
   - Édition profil + upload photo (bucket Storage privé, URLs signées).

6. **Découverte & matching**
   - Vue liste + swipe (like / pass) filtrable par pays, ville, tranche d'âge, objectif, langue.
   - Table `likes` + détection de match mutuel → conversation créée.
   - Suggestions triées par affinité simple (objectif commun, ville, intérêts partagés).

7. **Chat anonyme + révélation progressive**
   - Messagerie temps réel via Supabase Realtime (pas besoin de Socket.io séparé).
   - Chat identifié uniquement par le code MonWé des deux côtés.
   - Bouton « Révéler mon profil » → nécessite consentement des deux → débloque photo nette + nom + réseaux.
   - Signalement + blocage utilisateur.

8. **Sécurité**
   - RLS partout, rôles via table `user_roles` séparée (jamais dans `profiles`).
   - Validation Zod côté client + contraintes DB.
   - Storage privé, RLS sur `storage.objects`.
   - Rate-limiting applicatif basique sur likes/messages.

## Hors MVP (Phase 2+, à confirmer plus tard)

- **Premium / paiements** : Mobile Money (Africa) + Stripe (diaspora). À activer via `enable_stripe_payments` quand tu voudras.
- **Vérification SMS** (Twilio) et **badge photo vérifiée**.
- **Back-office modérateur** dédié (au MVP : accès admin via rôle `admin` sur les tables clés).
- **PWA installable** (manifest + icônes). Le site est déjà responsive et rapide ; on ajoute le manifest à la demande.
- **App Android** (wrapper Capacitor plus tard).
- **Salons par pays / events communautaires**.

## Détails techniques

- Stack : TanStack Start (déjà en place) + Lovable Cloud (Supabase géré).
- Routes protégées sous `src/routes/_authenticated/` (layout géré par l'intégration).
- Server functions (`createServerFn` + `requireSupabaseAuth`) pour matching, révélation, signalement.
- Realtime Supabase pour messages (subscribe côté client sur la conversation).
- Génération du code MonWé : fonction SQL `generate_monwe_code()` (préfixe `MW-` + 4 chiffres, unique).
- Schéma initial :
  - `profiles(user_id, pseudo, monwe_code, real_name, photo_url, photo_blurred, country, city, birthdate, bio, languages[], goals[], created_at)`
  - `interests(id, label)` + `profile_interests(profile_id, interest_id)`
  - `likes(from_user, to_user, created_at, unique)`
  - `matches(user_a, user_b, created_at)` (a < b)
  - `conversations(id, match_id, reveal_a, reveal_b)`
  - `messages(id, conversation_id, sender_id, body, created_at)`
  - `reports(id, reporter_id, target_user_id, reason, message_id?, created_at)`
  - `blocks(blocker_id, blocked_id)`
  - `user_roles(user_id, role)` + `has_role()` SECURITY DEFINER.
- Bucket Storage `avatars` (privé), URLs signées côté server fn.

## Questions avant de démarrer

1. **Auth SMS** : au MVP je pars sur email + Google seulement (SMS via Twilio = clé payante + setup). OK ou tu veux SMS dès le début ?
2. **Langue de l'interface** : je pars 100% français. On ajoute EN/autres plus tard ?
3. **Photo au MVP** : upload libre + option floutage côté profil, modération manuelle via signalements. OK ?
4. **Premium au MVP** : je ne l'active pas (structure prête mais pas de paiement). OK ?

Réponds « go » (ou ajuste les 4 points) et je construis le MVP dans la foulée.
