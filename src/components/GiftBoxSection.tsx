import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Gift, Sparkles, Heart, RefreshCw } from 'lucide-react';
import { audio } from '../utils/audio';
import { triggerConfetti, triggerMassiveConfetti } from '../utils/confetti';
import { GreetingModal } from './GreetingModal';

export const GiftBoxSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxOpened, setBoxOpened] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 3D references
  const boxGroupRef = useRef<THREE.Group | null>(null);
  const lidGroupRef = useRef<THREE.Group | null>(null);
  const ribbonGroupRef = useRef<THREE.Group | null>(null);
  const geyserParticlesRef = useRef<THREE.Points | null>(null);
  const isOpeningRef = useRef(false);
  const openProgressRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.8, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambient = new THREE.AmbientLight(0xffeedd, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffdf80, 2.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf43f5e, 1.8);
    fillLight.position.set(-6, -2, 4);
    scene.add(fillLight);

    const pointLight = new THREE.PointLight(0xffd700, 2.5, 12);
    pointLight.position.set(0, 1.5, 3);
    scene.add(pointLight);

    // 3. Gift Box Master Group
    const giftGroup = new THREE.Group();
    giftGroup.position.y = -0.5;
    scene.add(giftGroup);
    boxGroupRef.current = giftGroup;

    // Materials
    // Luxury Deep Velvet Ruby
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x9f1239, // Deep ruby
      roughness: 0.28,
      metalness: 0.2,
    });

    // Satin Gold Ribbon Material
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.88,
      roughness: 0.18,
    });

    // A. Box Base (2.4 x 2.0 x 2.4)
    const baseGeom = new THREE.BoxGeometry(2.4, 2.0, 2.4);
    const boxBase = new THREE.Mesh(baseGeom, boxMat);
    boxBase.castShadow = true;
    boxBase.receiveShadow = true;
    giftGroup.add(boxBase);

    // Base Ribbon Strips (Cross around sides and bottom)
    const ribbonW = 0.35;
    const ribbonThick = 0.03;
    const ribbonBaseZ = new THREE.Mesh(
      new THREE.BoxGeometry(2.42, 2.02, ribbonW),
      ribbonMat
    );
    giftGroup.add(ribbonBaseZ);

    const ribbonBaseX = new THREE.Mesh(
      new THREE.BoxGeometry(ribbonW, 2.02, 2.42),
      ribbonMat
    );
    giftGroup.add(ribbonBaseX);

    // B. Box Lid Group (Moves & tilts during open)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 1.15, 0);
    giftGroup.add(lidGroup);
    lidGroupRef.current = lidGroup;

    const lidGeom = new THREE.BoxGeometry(2.55, 0.45, 2.55);
    const boxLid = new THREE.Mesh(lidGeom, boxMat);
    boxLid.position.y = 0;
    lidGroup.add(boxLid);

    // Lid Ribbon Cross
    const ribbonLidZ = new THREE.Mesh(
      new THREE.BoxGeometry(2.58, 0.48, ribbonW),
      ribbonMat
    );
    lidGroup.add(ribbonLidZ);

    const ribbonLidX = new THREE.Mesh(
      new THREE.BoxGeometry(ribbonW, 0.48, 2.58),
      ribbonMat
    );
    lidGroup.add(ribbonLidX);

    // C. Ribbon Bow on Top
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, 0.26, 0);
    lidGroup.add(bowGroup);
    ribbonGroupRef.current = bowGroup;

    // Bow loops (Torus geometries angled into lush loops)
    const loopGeom = new THREE.TorusGeometry(0.38, 0.1, 16, 32);
    const loop1 = new THREE.Mesh(loopGeom, ribbonMat);
    loop1.rotation.x = Math.PI / 4;
    loop1.rotation.y = Math.PI / 4;
    bowGroup.add(loop1);

    const loop2 = new THREE.Mesh(loopGeom, ribbonMat);
    loop2.rotation.x = -Math.PI / 4;
    loop2.rotation.y = -Math.PI / 4;
    bowGroup.add(loop2);

    const loop3 = new THREE.Mesh(loopGeom, ribbonMat);
    loop3.rotation.x = Math.PI / 4;
    loop3.rotation.y = -Math.PI / 4;
    bowGroup.add(loop3);

    const loop4 = new THREE.Mesh(loopGeom, ribbonMat);
    loop4.rotation.x = -Math.PI / 4;
    loop4.rotation.y = Math.PI / 4;
    bowGroup.add(loop4);

    // Center knot sphere
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), ribbonMat);
    bowGroup.add(knot);

    // D. Swirling Ambient Glowing Particles
    const particleCount = 100;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePos[i * 3] = radius * Math.cos(phi) * Math.sin(theta);
      particlePos[i * 3 + 1] = radius * Math.sin(phi) + 0.5;
      particlePos[i * 3 + 2] = radius * Math.cos(phi) * Math.cos(theta);
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffdf6d,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const ambientParticles = new THREE.Points(particleGeom, particleMat);
    giftGroup.add(ambientParticles);

    // E. Celebration Geyser Particles (erupts on box open)
    const geyserCount = 150;
    const geyserGeom = new THREE.BufferGeometry();
    const geyserPos = new Float32Array(geyserCount * 3);
    const geyserVel: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < geyserCount; i++) {
      geyserPos[i * 3] = 0;
      geyserPos[i * 3 + 1] = 0.5;
      geyserPos[i * 3 + 2] = 0;

      geyserVel.push({
        x: (Math.random() - 0.5) * 0.08,
        y: 0.1 + Math.random() * 0.14,
        z: (Math.random() - 0.5) * 0.08,
      });
    }
    geyserGeom.setAttribute('position', new THREE.BufferAttribute(geyserPos, 3));

    const geyserMat = new THREE.PointsMaterial({
      color: 0xff4081,
      size: 0.18,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const geyser = new THREE.Points(geyserGeom, geyserMat);
    giftGroup.add(geyser);
    geyserParticlesRef.current = geyser;

    // 4. Click / Tap Handler
    const handleBoxInteraction = () => {
      if (isOpeningRef.current || boxOpened) return;
      openGiftBox();
    };

    container.addEventListener('pointerdown', handleBoxInteraction);

    // 5. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);

      if (container.clientWidth < 640) {
        camera.position.set(0, 2.5, 9.2);
      } else {
        camera.position.set(0, 2.8, 8.2);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // 6. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Idle float & wobble
      if (giftGroup && !isOpeningRef.current && !boxOpened) {
        giftGroup.position.y = -0.5 + Math.sin(elapsed * 2) * 0.12;
        giftGroup.rotation.y = Math.sin(elapsed * 0.8) * 0.25;
        giftGroup.rotation.x = Math.sin(elapsed * 1.2) * 0.05;
      }

      // Swirl ambient particles
      ambientParticles.rotation.y += 0.008;
      ambientParticles.rotation.x = Math.sin(elapsed * 0.5) * 0.1;

      // Opening Animation Progression
      if (isOpeningRef.current && openProgressRef.current < 1) {
        openProgressRef.current += 0.02;
        const p = openProgressRef.current;

        // Ribbon unknots & shrinks
        if (ribbonGroupRef.current) {
          const s = Math.max(0, 1 - p * 2);
          ribbonGroupRef.current.scale.set(s, s, s);
        }

        // Lid lifts and tilts back
        if (lidGroupRef.current) {
          lidGroupRef.current.position.y = 1.15 + p * 2.8;
          lidGroupRef.current.position.z = -p * 1.4;
          lidGroupRef.current.rotation.x = -p * (Math.PI / 2.5);
        }

        // Geyser eruption
        if (geyserParticlesRef.current) {
          geyserMat.opacity = Math.min(1, p * 2.5);
          const gPos = geyserGeom.attributes.position.array as Float32Array;
          for (let i = 0; i < geyserCount; i++) {
            gPos[i * 3] += geyserVel[i].x;
            gPos[i * 3 + 1] += geyserVel[i].y;
            gPos[i * 3 + 2] += geyserVel[i].z;
            geyserVel[i].y -= 0.003; // gravity
          }
          geyserGeom.attributes.position.needsUpdate = true;
        }

        if (openProgressRef.current >= 1) {
          setBoxOpened(true);
          setShowModal(true);
          setIsAnimating(false);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', handleBoxInteraction);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [boxOpened]);

  // Trigger Open Box
  const openGiftBox = () => {
    isOpeningRef.current = true;
    setIsAnimating(true);

    // Haptics
    if (navigator.vibrate) {
      navigator.vibrate([40, 50, 70, 110]);
    }

    // Audio & Confetti
    audio.playGiftUnwrap();
    triggerConfetti(0.5, 0.45);
    setTimeout(() => {
      triggerMassiveConfetti();
    }, 600);
  };

  // Re-wrap Box
  const rewrapBox = () => {
    isOpeningRef.current = false;
    openProgressRef.current = 0;
    setBoxOpened(false);
    setShowModal(false);

    if (ribbonGroupRef.current) {
      ribbonGroupRef.current.scale.set(1, 1, 1);
    }
    if (lidGroupRef.current) {
      lidGroupRef.current.position.set(0, 1.15, 0);
      lidGroupRef.current.rotation.set(0, 0, 0);
    }
    if (geyserParticlesRef.current) {
      (geyserParticlesRef.current.material as THREE.PointsMaterial).opacity = 0;
    }
  };

  return (
    <section
      id="present-box"
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0d0e1b] via-[#151124] to-[#090a12] py-20 px-4 select-none"
    >
      {/* Background Magic Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-rose-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-amber-500/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-20 text-center max-w-2xl mb-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md mb-3">
          <Gift className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-xs font-semibold tracking-widest uppercase text-amber-300">
            Mystery Birthday Present
          </span>
        </div>
        <h2 className="font-['Cinzel'] text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-rose-200 to-amber-200">
          Unwrap Kajal's Gift
        </h2>
        <p className="mt-2 text-sm text-slate-300/80 font-light">
          Tap or click the 3D gift box to unknot the satin ribbon and reveal a personalized celebration greeting & tribute video!
        </p>
      </div>

      {/* 3D Canvas Box Container */}
      <div className="relative w-full max-w-3xl h-[420px] sm:h-[480px] flex items-center justify-center">
        <div
          ref={containerRef}
          className="w-full h-full cursor-pointer touch-none"
          title="Click or tap to unbox gift"
        />

        {/* Action Prompt Pill */}
        {!boxOpened && !isAnimating && (
          <button
            onClick={openGiftBox}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs sm:text-sm font-semibold shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Tap to Open Gift 🎁</span>
          </button>
        )}

        {boxOpened && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              <span>View Greeting & Video</span>
            </button>
            <button
              onClick={rewrapBox}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium border border-white/15 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-wrap</span>
            </button>
          </div>
        )}
      </div>

      {/* Greeting Modal (Revealed Letter & Video Player) */}
      {showModal && (
        <GreetingModal
          onClose={() => setShowModal(false)}
          onRewrap={rewrapBox}
        />
      )}
    </section>
  );
};
