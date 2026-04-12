"use client";

import Image from "next/image";

const services = [
  {
    image: "/images/logos-portfolio.jpg",
    span: "col-span-2 row-span-2",
    label: "Custom Logo Design",
    description: "Professional logos for your brand, team, or business",
  },
  {
    image: "/images/uniforms-display-2.jpg",
    span: "col-span-2 row-span-1",
    label: "Sports Jersey Sets",
    description: "Full team uniforms with custom names and numbers",
  },
  {
    image: "/images/surge-tee.jpg",
    span: "col-span-1 row-span-2",
    label: "Team Uniforms",
    description: "Matching sets for your entire squad",
  },
  {
    image: "/images/berserk-tee.jpg",
    span: "col-span-1 row-span-1",
    label: "Custom Tees",
    description: "Your design on quality cotton",
  },
  {
    image: "/images/team-jerseys.jpg",
    span: "col-span-2 row-span-1",
    label: "Hooded Jerseys",
    description: "Unique hooded styles with full sublimation",
  },
  {
    image: "/images/custom-hoodie.jpg",
    span: "col-span-1 row-span-2",
    label: "All-Over Prints",
    description: "Edge-to-edge custom designs",
  },
  {
    image: "/images/work-shirt.jpg",
    span: "col-span-1 row-span-1",
    label: "Work Uniforms",
    description: "Professional apparel for your staff",
  },
  {
    image: "/images/team-red.jpg",
    span: "col-span-2 row-span-1",
    label: "Team Orders",
    description: "Outfit your whole crew for any event",
  },
  {
    image: "/images/action-shot.jpg",
    span: "col-span-1 row-span-1",
    label: "Game Ready",
    description: "Built for performance",
  },
  {
    image: "/images/anime-tees.jpg",
    span: "col-span-1 row-span-1",
    label: "Custom Prints",
    description: "Anime, characters, artwork",
  },
];

export function FeaturedProductsSection() {
  return (
    <section id="technology" className="relative bg-background py-20 md:py-32">
      <div className="px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            <span className="text-coqui-blue">What</span>{" "}
            <span className="text-foreground">We</span>{" "}
            <span className="text-coqui-red">Do</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Custom logo design, mockups, jersey sets for sports teams, work uniforms, and custom birthday party shirts
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-7xl mx-auto auto-rows-[180px] md:auto-rows-[220px]">
          {services.map((service, index) => (
            <div 
              key={index} 
              className={`group relative overflow-hidden rounded-2xl border border-border bg-muted ${service.span} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer ${index % 2 === 0 ? 'hover:ring-2 hover:ring-coqui-blue/50' : 'hover:ring-2 hover:ring-coqui-red/50'}`}
            >
              {/* Image */}
              <Image
                src={service.image}
                alt={service.label}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              
              {/* Label */}
              <div className="absolute bottom-4 left-4 right-4">
                <span className="block text-sm md:text-base font-semibold text-white">
                  {service.label}
                </span>
                <span className="block text-xs text-white/70 mt-1">
                  {service.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
