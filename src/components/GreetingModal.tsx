import { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Sparkles, Heart, Share2, Check, RefreshCw } from 'lucide-react';
import { audio } from '../utils/audio';
import { triggerConfetti, triggerMassiveConfetti } from '../utils/confetti';

interface GreetingModalProps {
  onClose: () => void;
  onRewrap: () => void;
}

export const GreetingModal = ({ onClose, onRewrap }: GreetingModalProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'card' | 'video'>('card');
  const [copied, setCopied] = useState(false);
  const [customWish, setCustomWish] = useState(
    'Dearest Kajal,\n\nWishing you an extraordinary birthday filled with boundless laughter, thrilling adventures, and radiant joy. May this new year bring you closer to all your grandest dreams, surround you with warmth, and illuminate your path with triumph and love.\n\nNever forget how deeply inspiring and wonderfully unique you are.\n\nWith all our love and warmest wishes,\nAlways & Forever ✨'
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `🎉 Wishing Kajal the happiest birthday! Check out her 3D celebration: ${window.location.href}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      triggerConfetti();
      audio.playChime(3);
    }
  };

  return (
    <div
      id="greeting-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg overflow-y-auto animate-in fade-in duration-300"
    >
      <div
        id="greeting-modal-card"
        className="relative max-w-2xl w-full my-auto bg-gradient-to-b from-[#18152e] via-[#121124] to-[#0c0c17] border border-amber-400/40 rounded-3xl overflow-hidden shadow-2xl shadow-rose-950/50 p-6 sm:p-8 animate-in zoom-in-95 duration-400"
      >
        {/* Top Actions */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-['Cinzel'] text-base sm:text-lg font-bold text-amber-200">
                A Royal Gift For Kajal
              </h3>
              <p className="text-[11px] text-slate-400">Personalized Birthday Tribute</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRewrap();
                audio.playChime(0);
              }}
              title="Close and Re-wrap Gift Box"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Re-wrap Box</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle: Card vs Video */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab('card');
              audio.playChime(1);
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'card'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            💌 Personalized Greeting Card
          </button>
          <button
            onClick={() => {
              setActiveTab('video');
              audio.playChime(2);
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            🎬 Birthday Video Reel
          </button>
        </div>

        {/* Tab 1: Personalized Greeting Card */}
        {activeTab === 'card' && (
          <div className="space-y-4">
            <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#fcf9f2] via-[#faf5e8] to-[#f4ece0] text-slate-900 shadow-xl border-2 border-amber-300/60">
              {/* Decorative Corner Filigree */}
              <div className="absolute top-3 left-3 text-amber-600/30 font-serif text-xl">✦</div>
              <div className="absolute top-3 right-3 text-amber-600/30 font-serif text-xl">✦</div>
              <div className="absolute bottom-3 left-3 text-amber-600/30 font-serif text-xl">✦</div>
              <div className="absolute bottom-3 right-3 text-amber-600/30 font-serif text-xl">✦</div>

              <div className="text-center mb-4">
                <span className="text-[11px] uppercase tracking-widest text-amber-800/80 font-bold">
                  Exclusive Birthday Greeting
                </span>
                <h4 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">
                  Dearest Kajal
                </h4>
                <div className="w-16 h-0.5 bg-amber-400 mx-auto mt-2 rounded-full" />
              </div>

              {isEditing ? (
                <textarea
                  rows={8}
                  value={customWish}
                  onChange={(e) => setCustomWish(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/80 border border-amber-400/50 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <p className="text-xs sm:text-sm text-slate-800/90 leading-relaxed font-serif whitespace-pre-line text-center px-2 sm:px-6 italic">
                  {customWish}
                </p>
              )}

              <div className="mt-6 flex items-center justify-between pt-3 border-t border-amber-900/15">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-[11px] text-amber-900 hover:text-rose-700 font-semibold underline underline-offset-4"
                >
                  {isEditing ? 'Save Custom Letter' : 'Customize Letter'}
                </button>
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                  <span>Always Cherished</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Birthday Video Reel Player */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl flex items-center justify-center group">
              {/* Cinematic Tribute Visual Background */}
              <img
                src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80"
                alt="Birthday Tribute Reel"
                className={`w-full h-full object-cover transition-transform duration-1000 ${
                  isPlaying ? 'scale-105' : 'scale-100 filter brightness-75'
                }`}
              />

              {/* Glowing Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

              {/* Animated Celebration Reel Centerpiece */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-rose-500/30 backdrop-blur-md border border-rose-400/50 flex items-center justify-center mb-3 animate-pulse">
                  <Sparkles className="w-7 h-7 text-amber-200" />
                </div>
                <h4 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-white tracking-widest drop-shadow-md">
                  KAJAL'S RADIANT JOURNEY
                </h4>
                <p className="text-xs text-amber-200/90 font-light mt-1 max-w-sm">
                  "May your smile shine brighter than a thousand stars. Happy Birthday!"
                </p>
              </div>

              {/* Video Player Overlay Controls */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 text-white text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                      audio.playChime(1);
                    }}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <span className="text-[11px] text-slate-300">
                    {isPlaying ? 'Playing Birthday Tribute' : 'Paused'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              triggerMassiveConfetti();
              audio.playFanfare();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-500/25 hover:opacity-95 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Celebrate with Confetti Shower</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Share Wishes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
