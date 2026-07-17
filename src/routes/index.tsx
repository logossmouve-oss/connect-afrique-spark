import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-monwe.jpg";
import { SiteHeader } from "@/components/monwe/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <WhyMonwe />
        <Benefits />
        <ThreePillars />
        <Features />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div className="flex flex-col justify-center">
          <span className="monwe-chip w-fit">
            <span aria-hidden>●</span> Nouveau · Afrique & diaspora
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] text-balance sm:text-6xl lg:text-7xl">
            MonWé :{" "}
            <span className="italic text-primary">ton monde,</span>{" "}
            <span className="italic text-secondary">ton love,</span>{" "}
            <span className="italic text-accent-foreground">ta personne.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground text-balance">
            L'app de rencontre 100% africaine où tu parles comme chez toi et
            où tu peux enfin trouver ta personne — en sécurité, à ton rythme,
            depuis le Gabon et la diaspora.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full shadow-warm">
              <Link to="/auth">Créer mon compte</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href="#comment-ca-marche">Découvrir comment ça marche</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>✓ Inscription gratuite</span>
            <span>✓ Anonymat au début</span>
            <span>✓ PWA légère</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 -z-10 gradient-sunset rounded-[3rem] opacity-30 blur-2xl" />
          <div className="overflow-hidden rounded-[2.5rem] border border-border shadow-warm">
            <img
              src={heroImage}
              alt="Rencontres MonWé — profil, chat et matching sur mobile"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <span className="monwe-chip">{eyebrow}</span>}
      <h2 className="mt-4 font-display text-4xl font-bold text-balance sm:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted-foreground text-balance">{subtitle}</p>}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Crée ton profil", body: "Pseudo, photo, et ce que tu cherches : amour, amitié, projets." },
    { n: "02", title: "Matche à ton rythme", body: "Des profils près de chez toi ou dans la diaspora, selon tes filtres." },
    { n: "03", title: "Discute, puis dévoile-toi", body: "Chat tranquille sous pseudo, révèle ton profil quand tu le sens." },
  ];
  return (
    <section id="comment-ca-marche" className="border-t border-border/60 gradient-earth py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Comment ça marche"
          title="Comment MonWé t'aide à trouver ta personne"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <div className="font-display text-6xl font-bold text-primary/25">{s.n}</div>
              <h3 className="mt-4 font-display text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyMonwe() {
  const items = [
    { title: "Pensé pour l'Afrique et la diaspora", body: "On connaît tes réalités, ta façon de parler, ta culture." },
    { title: "Langage local", body: "Une app qui comprend le tolibangando, le nouchi, la street — pas juste le français scolaire." },
    { title: "Sécurité & respect", body: "Profils vérifiés, anonymat possible au début, blocage et signalement en un tap." },
    { title: "Accessible partout", body: "PWA légère, marche sur réseaux moyens, s'installe en un clic." },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Pourquoi MonWé" title="Ce qui rend MonWé différent" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {items.map((i) => (
            <div key={i.title} className="rounded-3xl border border-border bg-card p-8">
              <h3 className="font-display text-2xl font-semibold text-primary">{i.title}</h3>
              <p className="mt-2 text-muted-foreground">{i.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const bullets = [
    "Rencontre des célibataires près de toi — Libreville, Port-Gentil, Franceville et bien au-delà.",
    "Filtre par ce que tu veux vraiment : relation sérieuse, amitié, projets, diaspora.",
    "Discute sans pression grâce au pseudo et au code MonWé avant de te dévoiler.",
    "Booste ton profil pour être vu par ceux qui te correspondent le plus.",
  ];
  return (
    <section className="border-y border-border/60 bg-secondary text-secondary-foreground py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="monwe-chip" style={{ background: "rgba(255,255,255,0.12)", color: "inherit", borderColor: "rgba(255,255,255,0.2)" }}>
            Tes avantages
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-balance sm:text-5xl">
            Ce que MonWé t'apporte
          </h2>
          <p className="mt-4 text-lg opacity-80 text-balance">
            Une app qui te donne le contrôle : ton rythme, tes filtres, ton anonymat.
          </p>
        </div>
        <ul className="space-y-4">
          {bullets.map((b) => (
            <li key={b} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
                ✓
              </span>
              <span className="text-base">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ThreePillars() {
  const pillars = [
    { title: "Ton monde", body: "MonWé respecte ta culture, ta manière de parler, ton environnement. Faite pour les réalités africaines, pas un clone d'Europe." },
    { title: "Ton love", body: "Le but est clair : t'aider à trouver quelqu'un qui te correspond vraiment. Pas juste du fun sans lendemain — sauf si tu le veux." },
    { title: "Ta personne", body: "On veut que tu puisses dire un jour : « c'est elle, c'est lui — c'est mon wé ». Une vraie connexion, à ton rythme." },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Nos valeurs" title="Les 3 piliers de MonWé" />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p, idx) => (
            <div key={p.title} className="relative overflow-hidden rounded-3xl border border-border bg-card p-8">
              <div
                className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70"
                style={{
                  background: [
                    "var(--terracotta)",
                    "var(--forest)",
                    "var(--ochre)",
                  ][idx],
                }}
              />
              <h3 className="relative font-display text-3xl font-bold italic">{p.title}</h3>
              <p className="relative mt-3 text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const feats = [
    "Créer un profil en quelques minutes.",
    "Voir des profils près de toi, dans ton pays et la diaspora.",
    "Filtrer par âge, ville, type de relation.",
    "Discuter via un chat simple, rapide, sécurisé.",
    "Rester anonyme au début (pseudo, code MonWé), puis te dévoiler.",
    "Passer Premium : plus de likes, plus de visibilité, plus de filtres.",
  ];
  return (
    <section className="border-t border-border/60 gradient-earth py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Fonctionnalités" title="Ce que tu peux faire sur MonWé" />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((f, idx) => (
            <div key={f} className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-sm font-semibold text-primary">
                #{String(idx + 1).padStart(2, "0")}
              </div>
              <p className="mt-2 text-base">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      q: "Je voulais une app qui parle comme nous. Sur MonWé, j'ai rencontré quelqu'un qui comprend ma réalité.",
      a: "Aïcha, Libreville",
    },
    {
      q: "Grâce à MonWé, j'ai trouvé quelqu'un à Libreville alors que j'étais en France. On s'est connectés doucement, à notre rythme.",
      a: "Steve, Paris ↔ Libreville",
    },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Confiance" title="Ils ont trouvé leur wé" />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {quotes.map((t) => (
            <blockquote key={t.a} className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <p className="font-display text-2xl italic leading-snug text-balance">
                « {t.q} »
              </p>
              <footer className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                — {t.a}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] gradient-sunset p-12 text-center text-primary-foreground shadow-warm sm:p-16">
        <h2 className="font-display text-4xl font-bold text-balance sm:text-6xl">
          Prêt·e à trouver ta personne ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg opacity-90 text-balance">
          Rejoins MonWé et commence à discuter — sous ton code, à ton rythme.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary" className="rounded-full">
            <Link to="/auth">Créer mon compte MonWé</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-white/60 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
            <a href="#comment-ca-marche">Voir comment ça marche</a>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-90">
          <span>Inscription gratuite</span>
          <span>·</span>
          <span>Accessible depuis ton téléphone</span>
          <span>·</span>
          <span>Pensé pour l'Afrique et sa diaspora</span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-sunset font-display text-lg font-bold text-primary-foreground">
              M
            </span>
            <span className="font-display text-xl font-bold">MonWé</span>
          </div>
          <p className="mt-3 max-w-xs text-sm opacity-70">
            Ton monde, ton love, ta personne. Rencontres pour l'Afrique et sa diaspora.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-widest opacity-80">
            Ressources
          </h4>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            <li><a href="#" className="hover:opacity-100">Conditions d'utilisation</a></li>
            <li><a href="#" className="hover:opacity-100">Politique de confidentialité</a></li>
            <li><a href="#" className="hover:opacity-100">FAQ</a></li>
            <li><a href="mailto:hello@monwe.app" className="hover:opacity-100">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-widest opacity-80">
            Suis-nous
          </h4>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            <li><a href="#" className="hover:opacity-100">Instagram</a></li>
            <li><a href="#" className="hover:opacity-100">TikTok</a></li>
            <li><a href="#" className="hover:opacity-100">Facebook</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sidebar-border/60 py-6 text-center text-xs opacity-60">
        © {new Date().getFullYear()} MonWé — Fait avec ❤️ pour l'Afrique et sa diaspora.
      </div>
    </footer>
  );
}
