import { useEffect, useRef, useState, type FormEvent } from 'react';
import * as THREE from 'three';
import { Sparkles, ChevronLeft, ChevronRight, Eye, Plus, Heart, Calendar } from 'lucide-react';
import { INITIAL_MEMORIES } from '../data/memories';
import { MemoryItem } from '../types';
import { LightboxModal } from './LightboxModal';
import { audio } from '../utils/audio';

export const MemoryLaneSection = () => {
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [flippedCards, setFlippedCards] = useState<{ [id: string]: boolean }>({});
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Memory Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newImage, setNewImage] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Soft Bokeh Tunnel Three.js Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create Soft Bokeh Texture using an HTML5 offscreen canvas
    const createBokehTexture = () => {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d')!;

      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      gradient.addColorStop(0.25, 'rgba(255, 200, 220, 0.7)');
      gradient.addColorStop(0.6, 'rgba(240, 160, 200, 0.25)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      return new THREE.CanvasTexture(c);
    };

    const bokehTexture = createBokehTexture();

    // 160 Bokeh particle sprites drifting through tunnel
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const palette = [
      new THREE.Color(0xf43f5e), // rose
      new THREE.Color(0xfbbf24), // gold
      new THREE.Color(0xc084fc), // lavender
      new THREE.Color(0xf472b6), // pink
      new THREE.Color(0x38bdf8), // sky
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = -Math.random() * 35;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      scales[i] = 1.2 + Math.random() * 2.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      map: bokehTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const handleResize = () => {
      if (!canvas) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Drift particles forward through the tunnel
      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 2] += 0.04;
        pos[i * 3] += Math.sin(elapsed * 0.5 + i) * 0.005;

        // Loop back when passed camera
        if (pos[i * 3 + 2] > 6) {
          pos[i * 3 + 2] = -32;
          pos[i * 3] = (Math.random() - 0.5) * 22;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Subtle scene wobble
      scene.rotation.z = Math.sin(elapsed * 0.15) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
    audio.playChime(1);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % memories.length);
    audio.playChime(2);
  };

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + memories.length) % memories.length);
    audio.playChime(2);
  };

  const handleAddMemory = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: MemoryItem = {
      id: Date.now().toString(),
      title: newTitle,
      date: newDate || 'Today',
      caption: newCaption || 'A special moment to cherish forever.',
      image:
        newImage.trim() ||
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
      tag: 'Cherished Note',
      color: '#f43f5e',
    };

    setMemories([newItem, ...memories]);
    setShowAddModal(false);
    setNewTitle('');
    setNewDate('');
    setNewCaption('');
    setNewImage('');
    audio.playChime(4);
  };

  return (
    <section
      id="memory-lane"
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0c0d17] via-[#121324] to-[#0d0e1b] py-20 px-4"
    >
      {/* Three.js Bokeh Tunnel Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 text-center max-w-2xl mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-md mb-3">
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-xs font-semibold tracking-widest uppercase text-purple-300">
            Memory Lane
          </span>
        </div>
        <h2 className="font-['Cinzel'] text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-rose-200 to-purple-200">
          Floating Moments & Stories
        </h2>
        <p className="mt-2 text-sm text-slate-300/80 font-light">
          Hover or tap to flip polaroids and reveal hidden messages. Click any photo to open full lightbox!
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 text-rose-200 border border-rose-400/30 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>Add a Memory</span>
          </button>
        </div>
      </div>

      {/* 1. Desktop & Tablet 3D Floating Grid (with 3D Card Flip) */}
      <div className="relative z-10 hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full px-4">
        {memories.map((item, index) => {
          const isFlipped = !!flippedCards[item.id];
          const rotationAngle = ((index % 5) - 2) * 2; // subtle random polaroid tilt

          return (
            <div
              key={item.id}
              className="relative w-full h-[380px] perspective-[1200px] cursor-pointer group"
              style={{ transform: `rotate(${rotationAngle}deg)` }}
              onClick={() => toggleFlip(item.id)}
            >
              {/* 3D Flipper Container */}
              <div
                className={`relative w-full h-full duration-500 transition-transform [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                } group-hover:scale-[1.02]`}
              >
                {/* Front Side: Polaroid Frame */}
                <div className="absolute inset-0 w-full h-full bg-[#fdfbf7] p-4 rounded-xl shadow-xl shadow-black/60 flex flex-col justify-between [backface-visibility:hidden] border border-amber-100/50">
                  {/* Washi Tape Decor */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-amber-200/60 backdrop-blur-xs border border-amber-300/40 rotate-1 shadow-xs" />

                  {/* Photo Canvas */}
                  <div className="relative w-full h-[250px] bg-slate-200 rounded-md overflow-hidden group/img">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium">
                      {item.tag}
                    </div>
                  </div>

                  {/* Polaroid Bottom Caption */}
                  <div className="pt-2 flex items-center justify-between text-slate-800">
                    <div>
                      <h4 className="font-['Cinzel'] font-bold text-sm text-slate-900 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">{item.date}</p>
                    </div>
                    <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Flip ↻
                    </span>
                  </div>
                </div>

                {/* Back Side: Story & Lightbox Trigger */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#16182c] to-[#0f101d] p-6 rounded-xl shadow-xl shadow-black/80 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] border border-white/15 text-white">
                  <div>
                    <div className="flex items-center justify-between text-xs text-rose-300 mb-3">
                      <span className="font-semibold">{item.tag}</span>
                      <span className="text-slate-400">{item.date}</span>
                    </div>

                    <h4 className="font-['Cinzel'] text-lg font-bold text-amber-200 mb-2">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed font-light mt-3">
                      {item.caption}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMemory(item);
                        audio.playChime(3);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Lightbox</span>
                    </button>

                    <span className="text-[11px] text-slate-400">Click to flip back</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Mobile Touch Carousel & Vertical Scroll Fallback */}
      <div className="relative z-10 md:hidden w-full max-w-sm px-2">
        {/* Touch-Carousel Card */}
        {memories[carouselIndex] && (
          <div
            className="relative w-full h-[400px] perspective-[1200px] cursor-pointer"
            onClick={() => toggleFlip(memories[carouselIndex].id)}
          >
            <div
              className={`relative w-full h-full duration-500 transition-transform [transform-style:preserve-3d] ${
                flippedCards[memories[carouselIndex].id] ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              {/* Mobile Front */}
              <div className="absolute inset-0 w-full h-full bg-[#fdfbf7] p-4 rounded-2xl shadow-2xl flex flex-col justify-between [backface-visibility:hidden] border border-amber-100">
                <div className="relative w-full h-[270px] bg-slate-200 rounded-xl overflow-hidden">
                  <img
                    src={memories[carouselIndex].image}
                    alt={memories[carouselIndex].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-white">
                    {memories[carouselIndex].tag}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-slate-800">
                  <div>
                    <h4 className="font-['Cinzel'] font-bold text-sm text-slate-900">
                      {memories[carouselIndex].title}
                    </h4>
                    <p className="text-[11px] text-slate-500">{memories[carouselIndex].date}</p>
                  </div>
                  <span className="text-[10px] text-rose-500 font-semibold uppercase bg-rose-50 px-2 py-1 rounded-full border border-rose-200">
                    Tap to Flip
                  </span>
                </div>
              </div>

              {/* Mobile Back */}
              <div className="absolute inset-0 w-full h-full bg-[#16182c] p-6 rounded-2xl shadow-2xl flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] border border-white/15 text-white">
                <div>
                  <div className="flex items-center justify-between text-xs text-rose-300 mb-2">
                    <span>{memories[carouselIndex].tag}</span>
                    <span className="text-slate-400">{memories[carouselIndex].date}</span>
                  </div>
                  <h4 className="font-['Cinzel'] text-base font-bold text-amber-200 mb-2">
                    {memories[carouselIndex].title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {memories[carouselIndex].caption}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMemory(memories[carouselIndex]);
                      audio.playChime(3);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Lightbox</span>
                  </button>
                  <span className="text-[10px] text-slate-400">Tap to flip back</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Carousel Controls */}
        <div className="mt-4 flex items-center justify-between px-2">
          <button
            onClick={handlePrevCarousel}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {memories.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === carouselIndex ? 'w-6 bg-rose-400' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextCarousel}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedMemory && (
        <LightboxModal
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
        />
      )}

      {/* Add Custom Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141628] border border-white/20 p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="font-['Cinzel'] text-lg font-bold text-amber-200 mb-1">
              Add a Birthday Memory
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Add a personal photo story or heartfelt memory for Kajal.
            </p>

            <form onSubmit={handleAddMemory} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Memory Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Graduation Day Celebration"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Date or Occasion</label>
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="e.g. October 2025"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Paste image URL (leave empty for surprise)"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Heartfelt Story / Note</label>
                <textarea
                  rows={3}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Write a sweet memory or warm birthday wish..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md active:scale-95"
                >
                  Save to Memory Lane
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
