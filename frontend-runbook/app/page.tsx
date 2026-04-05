import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0B0B0C] text-white">

      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[40%] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] 
      bg-[linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),
      linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] 
      bg-[size:40px_40px]" />

      <main className="relative flex flex-col items-center text-center">

        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-indigo-500/10 rounded-full" />
          <Logo height={420} />
        </div>

        {/* Tagline */}
        <p className="mt-6 max-w-xl text-sm font-light tracking-wide text-neutral-400">
          Enterprise workflow orchestration
        </p>

        {/* Secondary line */}
        <p className="mt-2 max-w-lg text-xs text-neutral-500">
          Build and operate intelligent automation systems
        </p>

        {/* Divider */}
        <div className="mx-auto my-10 h-px w-20 bg-white/10" />

        {/* CTA */}
        <div className="flex justify-center gap-4">

          <Link href="/org/select-org">
            <Button className="px-6 py-5 text-sm bg-indigo-600 hover:bg-indigo-500 transition-all duration-300">
              Start Building
            </Button>
          </Link>

          <Button
            variant="outline"
            className="border-white/15 text-neutral-400 hover:border-white/30 hover:text-neutral-200 transition"
          >
            Learn More
          </Button>

        </div>

        {/* subtle branding */}
        <p className="mt-14 text-[10px] text-neutral-600 tracking-[0.25em]">
          RUNBOOK Inc.
        </p>

      </main>
    </div>
  );
}