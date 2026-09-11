import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Sparkles, Cake, Image as ImageIcon, Gift, Heart } from 'lucide-react';
import { audio } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';

interface NavigationProps {
  activeSection: string;
}

export const Navigation = ({ activeSection }: NavigationProps) => {
  const [soundOn, setSoundOn] = useState(true);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audio.soundEnabled = next;
    if (next) {
      audio.playChime(2);
    }
  };

  const toggleBgm = () => {
    const active = audio.toggleBgm();
    setBgmPlaying(active);
  };

  const navItems = [
    { id: 'hero', label: 'Celebration', icon: Sparkles },
    { id: 'cake', label: 'Make a Wish', icon: Cake },
    { id: 'memory-lane', label: 'Memory Lane', icon: ImageIcon },
    { id: 'present-box', label: 'Gift Box', icon: Gift },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-8 ${
        scrolled
          ? 'py-3 bg-[#0b0c14]/85 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <button
          id="nav-brand-button"
          onClick={() => scrollTo('hero')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-pink-500 p-[1.5px] shadow-sm shadow-rose-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0b0c14] rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30 animate-pulse" />
            </div>
          </div>
          <div>
            <span className="font-['Cinzel'] text-sm md:text-base font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100">
              KAJAL
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] tracking-wider uppercase text-rose-300/80 font-medium px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              Birthday Edition
            </span>
          </div>
        </button>

        {/* Section Links */}
        <nav id="nav-sections" className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1.5 backdrop-blur-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => scrollTo(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Audio & Actions Controls */}
        <div id="nav-controls" className="flex items-center gap-2">
          {/* Confetti Trigger */}
          <button
            id="nav-confetti-btn"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              triggerConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
              audio.playChime(3);
            }}
            title="Burst Celebration Confetti"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/30 text-amber-200 hover:border-amber-400 hover:bg-amber-500/30 transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">Cheer</span>
          </button>

          {/* BGM Toggle */}
          <button
            id="nav-bgm-toggle"
            onClick={toggleBgm}
            title={bgmPlaying ? 'Pause Birthday Music' : 'Play Birthday Music'}
            className={`p-2 rounded-full border transition-all ${
              bgmPlaying
                ? 'bg-rose-500/20 border-rose-400/60 text-rose-300 shadow-sm shadow-rose-500/30'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Music className={`w-4 h-4 ${bgmPlaying ? 'animate-bounce text-rose-300' : ''}`} />
          </button>

          {/* Sound FX Toggle */}
          <button
            id="nav-sound-toggle"
            onClick={toggleSound}
            title={soundOn ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
            className={`p-2 rounded-full border transition-all ${
              soundOn
                ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-[#0e101c]/90 border border-white/15 backdrop-blur-lg rounded-2xl p-1.5 shadow-2xl flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => scrollTo(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-rose-300 font-semibold bg-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
