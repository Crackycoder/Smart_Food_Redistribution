import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Leaf,
  Users,
  Zap,
  Heart,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShareBite — Share food, reduce waste" },
      {
        name: "description",
        content:
          "Join ShareBite to share excess food with people nearby. Realtime feed, instant chat, zero waste.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-background/40 backdrop-blur-3xl"
        />

        <div className="container mx-auto px-4 py-20 md:py-28 max-w-6xl">
          <div className="flex flex-col items-center text-center gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Realtime food redistribution platform
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
              Share a bite.{" "}
              <span className="bg-gradient-to-r from-primary to-[var(--primary-glow)] bg-clip-text text-transparent">
                Save the world.
              </span>
            </h1>
            <p className="max-w-2xl text-base md:text-lg text-muted-foreground">
              ShareBite turns surplus meals into smiles. Donors post excess food,
              receivers claim what they need — instantly, locally, and waste-free.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/feed">
                <Button size="lg" className="rounded-full">
                  Browse food <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/post">
                <Button size="lg" variant="outline" className="rounded-full">
                  Post excess food
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 max-w-6xl -mt-8 md:-mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { value: "1.3B", label: "tons wasted yearly" },
            { value: "828M", label: "people go hungry" },
            { value: "Realtime", label: "instant matching" },
            { value: "100%", label: "free to use" },
          ].map((s) => (
            <Card
              key={s.label}
              className="rounded-2xl p-5 backdrop-blur bg-card/60 border-border/60 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {s.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                {s.label}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 md:py-28 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Three simple steps from surplus to shared.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: UtensilsCrossed,
              title: "Post your excess",
              desc: "Snap a photo, set quantity and expiry. Your post goes live instantly.",
            },
            {
              icon: Zap,
              title: "Get claimed in realtime",
              desc: "Nearby receivers see and claim your meal the moment it's posted.",
            },
            {
              icon: Heart,
              title: "Chat & hand off",
              desc: "Coordinate pickup with built-in realtime chat. Done.",
            },
          ].map((f) => (
            <Card
              key={f.title}
              className="rounded-2xl p-6 border-border/60 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20 max-w-6xl">
        <Card
          className="relative overflow-hidden rounded-3xl border-border/60 p-10 md:p-14 text-center"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="relative z-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background/30 backdrop-blur mb-4">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">
              Every meal shared is a story rewritten.
            </h2>
            <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">
              Join the community turning leftovers into lifelines.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="rounded-full">
                  <Users className="h-4 w-4" /> Get started
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
