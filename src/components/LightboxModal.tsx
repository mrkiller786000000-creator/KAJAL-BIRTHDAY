import { X, Heart, Calendar, Tag, Sparkles } from 'lucide-react';
import { MemoryItem } from '../types';
import { audio } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import { useState } from 'react';

interface LightboxModalProps {
  memory: MemoryItem | null;
  onClose: () => void;
}

export const LightboxModal = ({ memory, onClose }: LightboxModalProps) => {
  const [likes, setLikes] = useState(24);
  const [liked, setLiked] = useState(false);

  if (!memory) return null;

  const handleLike = () => {
    if (!liked) {
      setLikes((c) => c + 1);
      setLiked(true);
      audio.playChime(1);
      triggerConfetti();
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  return (
    <div
      id="lightbox-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        id="lightbox-container"
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full bg-[#121422] border border-white/20 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col md:flex-row animate-in zoom-in-95 duration-300"
      >
        {/* Close Button */}
        <button
          id="lightbox-close-btn"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Preview */}
        <div className="relative w-full md:w-1/2 h-72 md:h-auto bg-black flex items-center justify-center overflow-hidden group">
          <img
            src={memory.image}
            alt={memory.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121422] via-transparent to-transparent md:hidden" />
        </div>

        {/* Content Side */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            {/* Tag and Date */}
            <div className="flex items-center justify-between gap-2 text-xs mb-3">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium">
                <Tag className="w-3 h-3" />
                {memory.tag}
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3" />
                {memory.date}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-['Cinzel'] text-xl font-bold text-white mb-2">
              {memory.title}
            </h3>

            {/* Caption & Story */}
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              {memory.caption}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-200/90 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span>
                "Moments like these define your radiant story, Kajal. Treasured forever!"
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                liked
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-white text-white' : 'text-rose-400'}`} />
              <span>{likes} Loves</span>
            </button>

            <button
              onClick={() => {
                triggerConfetti();
                audio.playChime(4);
              }}
              className="text-xs text-amber-300 hover:text-amber-200 font-medium underline underline-offset-4"
            >
              Celebrate Moment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
