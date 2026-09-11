/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { CakeSection } from './components/CakeSection';
import { MemoryLaneSection } from './components/MemoryLaneSection';
import { GiftBoxSection } from './components/GiftBoxSection';
import { Heart, Sparkles, ArrowUp } from 'lucide-react';
import { triggerConfetti } from './utils/confetti';
import { audio } from './utils/audio';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const sections = ['hero', 'cake', 'memory-lane', 'present-box'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.35;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerConfetti(0.5, 0.8);
    audio.playChime(4);
  };

  return (
    <div className="min-h-screen bg-[#0b0c14] text-[#f1f3f9] font-sans overflow-x-hidden selection:bg-rose-500/30 selection:text-rose-200">
      {/* Fixed Navigation Header */}
      <Navigation activeSection={activeSection} />

      {/* Main Sections */}
      <main className="flex flex-col w-full">
        {/* Section 1: Hero Section */}
        <HeroSection />

        {/* Section 2: Interactive Cake */}
        <CakeSection />

        {/* Section 3: Memory Lane */}
        <MemoryLaneSection />

        {/* Section 4: Present Box */}
        <GiftBoxSection />
      </main>

      {/* Celebratory Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-[#07080e] py-12 px-4 pb-24 md:pb-12 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-['Cinzel'] text-lg font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100">
              KAJAL'S 2026 BIRTHDAY
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <p className="text-xs text-slate-400 max-w-md font-light">
            Wishing you a year filled with dazzling victories, endless laughter, and boundless joy. May all your dreams take flight!
          </p>

          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-bounce" />
            <span>for Kajal's Special Day</span>
          </div>

          <button
            onClick={scrollToTop}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to Top</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
