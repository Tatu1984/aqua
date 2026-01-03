"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Dynamic import to avoid SSR issues with Three.js
const LiquidEther = dynamic(() => import("./liquid-ether"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0D1B2A] to-[#1B2838]" />
  ),
});

interface WaterHeroProps {
  enabled?: boolean;
}

export function WaterHero({ enabled = true }: WaterHeroProps) {
  if (!enabled) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0D1B2A] to-[#1B2838]" />
    );
  }

  return (
    <div className="absolute inset-0">
      {/* Liquid Ether Effect from ReactBits */}
      <LiquidEther
        colors={["#00FFFF", "#00D4FF", "#FF6B9D", "#C084FC", "#22D3EE"]}
        mouseForce={20}
        cursorSize={150}
        resolution={0.5}
        autoDemo={true}
        autoSpeed={0.5}
        autoIntensity={2.5}
        autoResumeDelay={1500}
        className="absolute inset-0 pointer-events-auto"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-dark/30 via-transparent to-ocean-dark/50 pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${100 + Math.random() * 20}%`,
            }}
            animate={{
              y: `-${10 + Math.random() * 20}%`,
              x: `${Math.random() * 100}%`,
            }}
            transition={{
              duration: 8 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
            style={{
              width: 2 + Math.random() * 4,
              height: 2 + Math.random() * 4,
            }}
          />
        ))}
      </div>
    </div>
  );
}
