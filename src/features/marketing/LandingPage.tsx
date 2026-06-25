import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { Sparkles, MessageSquare, CalendarDays, Check, ArrowRight } from "lucide-react";

const PILLARS = [
  {
    icon: Sparkles,
    title: "Persona-aware ghostwriting",
    body: "Posts drawn from your voice, pillars and avoid-list — never generic AI mush.",
  },
  {
    icon: MessageSquare,
    title: "An always-on PR strategist",
    body: "A chat agent that remembers every session, asks the hard questions, and catches drift.",
  },
  {
    icon: CalendarDays,
    title: "Plan, schedule, stay on rhythm",
    body: "See every draft and scheduled post in one calendar, built around a cadence you can keep.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-brand-50 text-brand-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-brand-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="mx-auto max-w-4xl px-5 pt-20 pb-16 text-center relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-500 shadow-brand-1">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            Be your own PR team
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-[52px]">
            Executive presence,
            <br />
            <span className="brand-gradient-text">without the PR agency.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-500">
            LinkedBloom is your AI brand strategist. It learns your voice, drafts posts that
            actually sound like you, and keeps you posting on rhythm — so you grow your presence
            without the grind.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="shadow-brand-2">
              <Link to="/signup">
                Start free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-brand-400">No credit card required · Set up your persona in minutes</p>
        </div>
      </section>

      {/* Value pillars */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-5 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-brand-200 bg-white p-6 shadow-brand-1">
              <div className="brand-gradient grid h-11 w-11 place-items-center rounded-xl shadow-brand-2">
                <p.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-1.5 text-sm text-brand-500">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="overflow-hidden rounded-3xl bg-ink-900 px-8 py-14 text-center text-white shadow-brand-3 sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">Your voice, amplified.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Join professionals building real thought leadership on LinkedIn — without sounding like everyone else.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
            {["Persona-aware drafts", "PR strategist chat", "Calendar & scheduling"].map((f) => (
              <span key={f} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-gold-500" /> {f}
              </span>
            ))}
          </div>
          <Button size="lg" variant="secondary" asChild className="mt-8">
            <Link to="/signup">
              Create your account <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-brand-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-brand-400">
          <BrandLogo size={26} />
          <span>© {new Date().getFullYear()} LinkedBloom · Be your own PR team</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
