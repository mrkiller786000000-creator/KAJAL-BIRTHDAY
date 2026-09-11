import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Mic, MicOff, RotateCcw, Wind, Sparkles, CheckCircle2 } from 'lucide-react';
import { audio } from '../utils/audio';
import { triggerConfetti, triggerMassiveConfetti } from '../utils/confetti';

interface CandleObject {
  id: number;
  group: THREE.Group;
  wickPos: THREE.Vector3;
  flameMesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  light: THREE.PointLight;
  isLit: boolean;
  smokeMesh: THREE.Mesh;
  smokeProgress: number;
}

export const CakeSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [candlesLitCount, setCandlesLitCount] = useState(5);
  const [micActive, setMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [allBlownOut, setAllBlownOut] = useState(false);
  const [userWish, setUserWish] = useState('');
  const [wishSaved, setWishSaved] = useState(false);

  // References for mutable animation loop data
  const candlesRef = useRef<CandleObject[]>([]);
  const isDraggingRef = useRef(false);
  const prevPointerXRef = useRef(0);
  const prevPointerYRef = useRef(0);
  const rotationVelocityYRef = useRef(0.003); // gentle auto-spin
  const rotationVelocityXRef = useRef(0);
  const cakeGroupRef = useRef<THREE.Group | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 3.8, 9.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambient = new THREE.AmbientLight(0xffeedd, 1.1);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff0dd, 2.0);
    dirLight.position.set(5, 10, 6);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xff6090, 1.6);
    rimLight.position.set(-6, 2, -4);
    scene.add(rimLight);

    // 3. Multi-Tiered Cake Construction
    const cakeGroup = new THREE.Group();
    cakeGroup.position.y = -1.2;
    scene.add(cakeGroup);
    cakeGroupRef.current = cakeGroup;

    // Stand Pedestal (Champagne Gold / Marble)
    const standMat = new THREE.MeshStandardMaterial({
      color: 0xe6c587,
      metalness: 0.8,
      roughness: 0.25,
    });
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.35, 48), standMat);
    standBase.position.y = 0;
    cakeGroup.add(standBase);

    const standPlate = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.15, 48), standMat);
    standPlate.position.y = 0.25;
    cakeGroup.add(standPlate);

    // Tier 1 (Bottom Tier - Warm Velvet Rose Cream)
    const tier1Mat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      roughness: 0.35,
      metalness: 0.05,
    });
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 1.2, 48), tier1Mat);
    tier1.position.y = 0.85;
    cakeGroup.add(tier1);

    // Piped Pearls around bottom tier base
    const pearlMat = new THREE.MeshStandardMaterial({ color: 0xfff0f5, roughness: 0.2 });
    const pearlCount1 = 32;
    for (let i = 0; i < pearlCount1; i++) {
      const angle = (i / pearlCount1) * Math.PI * 2;
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), pearlMat);
      pearl.position.set(Math.cos(angle) * 2.32, 0.35, Math.sin(angle) * 2.32);
      cakeGroup.add(pearl);
    }

    // Sprinkles on Tier 1
    const sprinkleColors = [0xffd700, 0x00f5d4, 0xff006e, 0x7b2cbf, 0xffffff];
    const sprinkleGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8);
    sprinkleGeom.rotateZ(Math.PI / 2);
    for (let i = 0; i < 40; i++) {
      const sMat = new THREE.MeshBasicMaterial({
        color: sprinkleColors[i % sprinkleColors.length],
      });
      const sMesh = new THREE.Mesh(sprinkleGeom, sMat);
      const angle = Math.random() * Math.PI * 2;
      const yPos = 0.4 + Math.random() * 0.9;
      sMesh.position.set(Math.cos(angle) * 2.31, yPos, Math.sin(angle) * 2.31);
      sMesh.rotation.y = -angle + Math.PI / 2;
      sMesh.rotation.z = Math.random() * Math.PI;
      cakeGroup.add(sMesh);
    }

    // Tier 2 (Middle Tier - Strawberry Vanilla White)
    const tier2Mat = new THREE.MeshStandardMaterial({
      color: 0xfff1f2,
      roughness: 0.3,
      metalness: 0.05,
    });
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 1.05, 48), tier2Mat);
    tier2.position.y = 1.95;
    cakeGroup.add(tier2);

    // Decorative gold ribbon band around middle tier
    const goldRibbonMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      metalness: 0.85,
      roughness: 0.2,
    });
    const ribbon2 = new THREE.Mesh(new THREE.CylinderGeometry(1.66, 1.66, 0.15, 48), goldRibbonMat);
    ribbon2.position.y = 1.55;
    cakeGroup.add(ribbon2);

    // Tier 3 (Top Tier - Elegant Pastel Peach)
    const tier3Mat = new THREE.MeshStandardMaterial({
      color: 0xfecdd3,
      roughness: 0.3,
      metalness: 0.05,
    });
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.85, 48), tier3Mat);
    tier3.position.y = 2.85;
    cakeGroup.add(tier3);

    // Rosette dollops on top tier
    const rosetteCount = 12;
    for (let i = 0; i < rosetteCount; i++) {
      const angle = (i / rosetteCount) * Math.PI * 2;
      const rosette = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), pearlMat);
      rosette.position.set(Math.cos(angle) * 0.95, 3.28, Math.sin(angle) * 0.95);
      cakeGroup.add(rosette);
    }

    // Happy Birthday Gold Plaque in front of middle tier
    const plaqueMat = new THREE.MeshStandardMaterial({
      color: 0xffdf78,
      metalness: 0.9,
      roughness: 0.15,
    });
    const plaque = new THREE.Mesh(new THREE.CylinderGeometry(1.67, 1.67, 0.45, 32, 1, false, -0.4, 0.8), plaqueMat);
    plaque.position.y = 1.95;
    cakeGroup.add(plaque);

    // 4. Lit Candles Setup
    const candleCount = 5;
    const candlesList: CandleObject[] = [];
    const candleRadius = 0.55;

    // Smoke Geometry
    const smokeGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0,
    });

    for (let i = 0; i < candleCount; i++) {
      const angle = (i / candleCount) * Math.PI * 2;
      const cX = Math.cos(angle) * candleRadius;
      const cZ = Math.sin(angle) * candleRadius;
      const cY = 3.28; // on top of tier 3

      const candleGroup = new THREE.Group();
      candleGroup.position.set(cX, cY, cZ);

      // Candle Stick (Spiral Striped)
      const candleStickMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xff6b81 : 0xffd166,
        roughness: 0.25,
      });
      const candleStick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.75, 16),
        candleStickMat
      );
      candleStick.position.y = 0.375;
      candleGroup.add(candleStick);

      // Wick
      const wickMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), wickMat);
      wick.position.y = 0.78;
      candleGroup.add(wick);

      // Glowing Flame Mesh (Tapered teardrop)
      const flameGeom = new THREE.ConeGeometry(0.07, 0.24, 16);
      flameGeom.translate(0, 0.12, 0);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffdd55,
      });
      const flameMesh = new THREE.Mesh(flameGeom, flameMat);
      flameMesh.position.y = 0.82;
      candleGroup.add(flameMesh);

      // Soft Outer Glow Mesh
      const glowGeom = new THREE.SphereGeometry(0.14, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff7700,
        transparent: true,
        opacity: 0.65,
      });
      const glowMesh = new THREE.Mesh(glowGeom, glowMat);
      glowMesh.position.y = 0.9;
      candleGroup.add(glowMesh);

      // Point Light casting warm flickering illumination
      const light = new THREE.PointLight(0xff9922, 1.8, 3.5);
      light.position.set(0, 0.95, 0);
      candleGroup.add(light);

      // Smoke Puff (hidden while lit)
      const smokeMesh = new THREE.Mesh(smokeGeom, smokeMat.clone());
      smokeMesh.position.y = 0.85;
      smokeMesh.visible = false;
      candleGroup.add(smokeMesh);

      // Tag for Raycaster detection
      candleStick.userData = { type: 'candle', id: i };
      flameMesh.userData = { type: 'candle', id: i };
      glowMesh.userData = { type: 'candle', id: i };

      cakeGroup.add(candleGroup);

      candlesList.push({
        id: i,
        group: candleGroup,
        wickPos: new THREE.Vector3(cX, cY + 0.85, cZ),
        flameMesh,
        glowMesh,
        light,
        isLit: true,
        smokeMesh,
        smokeProgress: 0,
      });
    }

    candlesRef.current = candlesList;

    // 5. Drag / Swipe 360° Interaction
    const handlePointerDown = (e: PointerEvent) => {
      // Check if clicking directly on a candle
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);
      const intersects = raycaster.intersectObjects(cakeGroup.children, true);

      let clickedCandle = false;
      for (const hit of intersects) {
        const ud = hit.object.userData;
        if (ud && ud.type === 'candle') {
          extinguishCandle(ud.id);
          clickedCandle = true;
          break;
        }
      }

      if (!clickedCandle) {
        isDraggingRef.current = true;
        prevPointerXRef.current = e.clientX;
        prevPointerYRef.current = e.clientY;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !cakeGroupRef.current) return;
      const deltaX = e.clientX - prevPointerXRef.current;
      const deltaY = e.clientY - prevPointerYRef.current;

      cakeGroupRef.current.rotation.y += deltaX * 0.008;
      rotationVelocityYRef.current = deltaX * 0.006;

      // Subtle tilt on X axis
      cakeGroupRef.current.rotation.x = Math.max(
        -0.25,
        Math.min(0.25, cakeGroupRef.current.rotation.x + deltaY * 0.003)
      );

      prevPointerXRef.current = e.clientX;
      prevPointerYRef.current = e.clientY;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 6. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;

      if (width < 640) {
        camera.position.set(0, 3.5, 9.8);
      } else {
        camera.position.set(0, 3.8, 8.6);
      }

      camera.lookAt(0, 0.4, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // 7. Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Inertia & Auto spin
      if (cakeGroupRef.current) {
        if (!isDraggingRef.current) {
          // Slow decay towards gentle idle spin
          rotationVelocityYRef.current +=
            (0.003 - rotationVelocityYRef.current) * 0.04;
          cakeGroupRef.current.rotation.y += rotationVelocityYRef.current;
          cakeGroupRef.current.rotation.x += (0 - cakeGroupRef.current.rotation.x) * 0.05;
        }
      }

      // Flame Flickering & Smoke Physics
      candlesRef.current.forEach((c, idx) => {
        if (c.isLit) {
          const flicker = Math.sin(elapsed * 18 + idx * 2.5) * 0.12;
          const flickerX = Math.cos(elapsed * 12 + idx) * 0.05;

          c.flameMesh.scale.set(1 + flicker, 1 + flicker * 1.5, 1 + flicker);
          c.flameMesh.rotation.z = flickerX;
          c.glowMesh.scale.set(1 + flicker * 0.8, 1 + flicker * 0.8, 1 + flicker * 0.8);
          c.light.intensity = 1.8 + flicker * 0.6;
        } else {
          // Smoke puff rising animation
          if (c.smokeProgress > 0 && c.smokeProgress < 1) {
            c.smokeProgress += 0.02;
            c.smokeMesh.visible = true;
            c.smokeMesh.position.y += 0.015;
            const mat = c.smokeMesh.material as THREE.MeshBasicMaterial;
            mat.opacity = Math.max(0, 1 - c.smokeProgress);
            const s = 1 + c.smokeProgress * 2.2;
            c.smokeMesh.scale.set(s, s, s);
          } else {
            c.smokeMesh.visible = false;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Extinguish Single Candle Function
  const extinguishCandle = (id: number) => {
    const candles = candlesRef.current;
    const c = candles.find((item) => item.id === id);
    if (!c || !c.isLit) return;

    c.isLit = false;
    c.flameMesh.visible = false;
    c.glowMesh.visible = false;
    c.light.intensity = 0;
    c.smokeProgress = 0.01;
    c.smokeMesh.position.y = 0.85;

    audio.playExtinguish();
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Trigger puff confetti
    const remaining = candles.filter((item) => item.isLit).length;
    setCandlesLitCount(remaining);

    if (remaining === 0) {
      handleAllCandlesOut();
    }
  };

  // Blow out all candles
  const blowOutAllCandles = () => {
    candlesRef.current.forEach((c, idx) => {
      if (c.isLit) {
        setTimeout(() => {
          extinguishCandle(c.id);
        }, idx * 120);
      }
    });
  };

  // Relight all candles
  const relightCandles = () => {
    candlesRef.current.forEach((c) => {
      c.isLit = true;
      c.flameMesh.visible = true;
      c.glowMesh.visible = true;
      c.light.intensity = 1.8;
      c.smokeProgress = 0;
      c.smokeMesh.visible = false;
    });
    setCandlesLitCount(candlesRef.current.length);
    setAllBlownOut(false);
    audio.playChime(4);
  };

  // Fanfare & Confetti when all candles extinguished
  const handleAllCandlesOut = () => {
    setAllBlownOut(true);
    audio.playFanfare();
    triggerMassiveConfetti();
  };

  // Microphone Blow Detection Setup
  const toggleMicrophone = async () => {
    if (micActive) {
      // Stop mic
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      setMicActive(false);
      setMicVolume(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setMicActive(true);

      // Volume & Blow detection loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let blowCounter = 0;

      const checkAudio = () => {
        if (!micStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        // Low frequency wind/breath energy (bins 1 to 14: ~40Hz to 400Hz)
        let lowEnergy = 0;
        for (let i = 1; i <= 14; i++) {
          lowEnergy += dataArray[i];
        }
        const avgLow = lowEnergy / 14;
        const normalized = Math.min(100, Math.round((avgLow / 255) * 100));
        setMicVolume(normalized);

        // Threshold for blowing directly into mic
        if (normalized > 42) {
          blowCounter++;
          if (blowCounter >= 3) {
            blowCounter = 0;
            // Extinguish lit candle
            const litCandles = candlesRef.current.filter((c) => c.isLit);
            if (litCandles.length > 0) {
              const randomIndex = Math.floor(Math.random() * litCandles.length);
              extinguishCandle(litCandles[randomIndex].id);
            }
          }
        } else {
          blowCounter = Math.max(0, blowCounter - 1);
        }

        requestAnimationFrame(checkAudio);
      };

      requestAnimationFrame(checkAudio);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      alert(
        'Microphone access was denied or not available. You can tap/click the candles directly to extinguish them!'
      );
      setMicActive(false);
    }
  };

  return (
    <section
      id="cake"
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0d0f1a] via-[#161224] to-[#0c0d17] py-16 px-4 select-none"
    >
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-20 text-center max-w-2xl mb-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 backdrop-blur-md mb-3">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-xs font-semibold tracking-widest uppercase text-rose-300">
            Interactive Birthday Cake
          </span>
        </div>
        <h2 className="font-['Cinzel'] text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-rose-200 to-amber-200">
          Make a Wish & Blow the Candles
        </h2>
        <p className="mt-2 text-sm text-slate-300/80 font-light">
          Drag to rotate the 3D cake in 360°. Tap any candle or enable microphone to blow out the flames!
        </p>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full max-w-4xl h-[420px] sm:h-[480px] md:h-[540px] flex items-center justify-center">
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
          title="Drag to rotate cake • Tap candles to blow out"
        />

        {/* Floating status pill */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b0c14]/80 border border-white/10 backdrop-blur-md shadow-lg text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-slate-300">
            Candles Lit:{' '}
            <strong className="text-amber-300 font-semibold">{candlesLitCount} / 5</strong>
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-center gap-3 mt-4 max-w-xl w-full px-4">
        {/* Microphone Blow Detector Button */}
        <button
          id="cake-mic-btn"
          onClick={toggleMicrophone}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-all shadow-md active:scale-95 ${
            micActive
              ? 'bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-400/50'
              : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
          }`}
        >
          {micActive ? <Mic className="w-4 h-4 animate-pulse text-white" /> : <MicOff className="w-4 h-4 text-slate-400" />}
          <span>{micActive ? 'Mic Active: Blow into Mic! 💨' : 'Use Mic to Blow 🎙️'}</span>
        </button>

        {/* Blow All Button */}
        <button
          id="cake-blow-all-btn"
          onClick={blowOutAllCandles}
          disabled={candlesLitCount === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Wind className="w-4 h-4 text-amber-300" />
          <span>Blow All Flames</span>
        </button>

        {/* Relight Candles Button */}
        <button
          id="cake-relight-btn"
          onClick={relightCandles}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Relight Candles</span>
        </button>
      </div>

      {/* Live Mic Volume Level Meter (when mic is active) */}
      {micActive && (
        <div className="relative z-20 mt-3 w-64 bg-black/40 border border-white/15 rounded-full p-1 flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-rose-400 ml-2 animate-bounce" />
          <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75"
              style={{ width: `${micVolume}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 pr-2 font-mono">{micVolume}%</span>
        </div>
      )}

      {/* Celebratory Wish Modal when all candles are blown out */}
      {allBlownOut && (
        <div
          id="cake-wish-banner"
          className="relative z-30 mt-6 max-w-lg w-full p-6 rounded-2xl bg-gradient-to-br from-rose-950/80 via-[#181226]/90 to-amber-950/70 border border-amber-400/40 backdrop-blur-xl shadow-2xl text-center animate-in fade-in zoom-in-95 duration-500"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-['Cinzel'] text-xl md:text-2xl font-bold text-amber-200">
            Happy Birthday, Kajal! ✨
          </h3>
          <p className="mt-1.5 text-xs text-rose-200/90 leading-relaxed">
            All candles have been extinguished! May every single wish you made today come true in the most wonderful way.
          </p>

          {/* Interactive Wish Form */}
          <div className="mt-4 flex flex-col gap-2">
            {!wishSaved ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userWish}
                  onChange={(e) => setUserWish(e.target.value)}
                  placeholder="Type a secret birthday wish for Kajal..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => {
                    if (userWish.trim()) {
                      setWishSaved(true);
                      triggerConfetti();
                      audio.playChime(3);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold text-xs hover:opacity-90 transition-opacity active:scale-95"
                >
                  Seal Wish
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-xs text-amber-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Your wish has been cast to the stars: "{userWish}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
