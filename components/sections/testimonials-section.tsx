"use client";

import Image from "next/image";

export function TestimonialsSection() {
  return (
    <section id="about" className="bg-background">
      {/* Hero Image at the End - Same as beginning */}
      <div className="relative aspect-[16/9] w-full">
        <Image
          src="/images/hero-team.jpg"
          alt="Team wearing custom COQUI shirts in the rain"
          fill
          className="object-cover"
        />
        {/* Fade gradient overlay - dark at bottom fading to transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-end justify-center px-6 pb-16 md:px-12 md:pb-24 lg:px-20 lg:pb-32">
          <p className="mx-auto max-w-5xl text-2xl leading-relaxed text-white md:text-3xl lg:text-[2.5rem] lg:leading-snug text-center">
            From custom logos to full team uniforms — 
            we handle everything from design mockups to the final print. Your vision, delivered fast.
          </p>
        </div>
      </div>

      {/* Colorful T-Shirts Explosion Section */}
      <div className="relative overflow-hidden bg-white py-20 md:py-32">
        {/* Color splashes background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Baby Blue splash */}
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-coqui-blue/30 blur-3xl" />
          <div className="absolute right-10 top-40 h-60 w-60 rounded-full bg-coqui-blue/20 blur-2xl" />
          {/* Red splash */}
          <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-coqui-red/30 blur-3xl" />
          <div className="absolute left-20 bottom-40 h-60 w-60 rounded-full bg-coqui-red/20 blur-2xl" />
          {/* Center accent */}
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-coqui-blue/10 via-transparent to-coqui-red/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
              <span className="text-coqui-blue">YOUR</span>{" "}
              <span className="text-foreground">IDEA</span>
            </h2>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mt-2">
              <span className="text-foreground">YOUR</span>{" "}
              <span className="text-coqui-red">SHIRT</span>
            </h2>
          </div>

          {/* T-Shirt Grid with color accents */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg ring-2 ring-coqui-blue/20 hover:ring-coqui-blue/50 transition-all duration-300 hover:scale-105">
              <Image
                src="/images/anime-tees.jpg"
                alt="Custom anime character shirts"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg ring-2 ring-coqui-red/20 hover:ring-coqui-red/50 transition-all duration-300 hover:scale-105">
              <Image
                src="/images/birthday-party.jpg"
                alt="Custom birthday party shirts"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg ring-2 ring-coqui-blue/20 hover:ring-coqui-blue/50 transition-all duration-300 hover:scale-105">
              <Image
                src="/images/barbershop-design.jpg"
                alt="Custom business logo design"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg ring-2 ring-coqui-red/20 hover:ring-coqui-red/50 transition-all duration-300 hover:scale-105">
              <Image
                src="/images/team-jerseys.jpg"
                alt="Custom team hooded jerseys"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-16 text-center">
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Custom logo design, mockups, jersey sets for sports teams, work uniforms, and birthday party shirts
            </p>
            <a
              href="#products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-coqui-blue to-coqui-red px-8 py-4 text-lg font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Start Your Order
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
