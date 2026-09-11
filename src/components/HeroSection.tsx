import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, ChevronDown, Music, Volume2 } from 'lucide-react';
import { audio } from '../utils/audio';
import { triggerConfetti, triggerLetterConfetti } from '../utils/confetti';

interface BalloonData {
  mesh: THREE.Group;
  color: number;
  initialY: number;
  speed: number;
  swaySpeed: number;
  swayOffset: number;
  popped: boolean;
  popTime: number;
}

interface LetterData {
  group: THREE.Group;
  index: number;
  char: string;
  baseX: number;
  baseY: number;
  scale: number;
  jumpY: number;
  jumpVel: number;
  rotY: number;
  rotVel: number;
}

export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [poppedCount, setPoppedCount] = useState(0);
  const [lastInteractedLetter, setLastInteractedLetter] = useState<string | null>(null);

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
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffd580, 2.5);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff3385, 2.2);
    rimLight.position.set(-6, -3, 5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x7c4dff, 1.6);
    fillLight.position.set(0, -6, 4);
    scene.add(fillLight);

    const centerPointLight = new THREE.PointLight(0xffffff, 2.0, 15);
    centerPointLight.position.set(0, 0, 4);
    scene.add(centerPointLight);

    // 3. Letters Group: K - A - J - A - L
    const lettersGroup = new THREE.Group();
    scene.add(lettersGroup);

    const createLetterShapes = (): { [key: string]: THREE.Shape } => {
      // Shape for K
      const shapeK = new THREE.Shape();
      shapeK.moveTo(-0.75, -1.1);
      shapeK.lineTo(-0.75, 1.1);
      shapeK.lineTo(-0.35, 1.1);
      shapeK.lineTo(-0.35, 0.2);
      shapeK.lineTo(0.38, 1.1);
      shapeK.lineTo(0.88, 1.1);
      shapeK.lineTo(0.08, 0.05);
      shapeK.lineTo(0.92, -1.1);
      shapeK.lineTo(0.42, -1.1);
      shapeK.lineTo(-0.35, -0.22);
      shapeK.lineTo(-0.35, -1.1);
      shapeK.closePath();

      // Shape for A
      const shapeA = new THREE.Shape();
      shapeA.moveTo(-0.85, -1.1);
      shapeA.lineTo(-0.24, 1.1);
      shapeA.lineTo(0.24, 1.1);
      shapeA.lineTo(0.85, -1.1);
      shapeA.lineTo(0.42, -1.1);
      shapeA.lineTo(0.24, -0.4);
      shapeA.lineTo(-0.24, -0.4);
      shapeA.lineTo(-0.42, -1.1);
      shapeA.closePath();

      const holeA = new THREE.Path();
      holeA.moveTo(-0.16, -0.05);
      holeA.lineTo(0, 0.65);
      holeA.lineTo(0.16, -0.05);
      holeA.closePath();
      shapeA.holes.push(holeA);

      // Shape for J
      const shapeJ = new THREE.Shape();
      shapeJ.moveTo(-0.65, 1.1);
      shapeJ.lineTo(0.65, 1.1);
      shapeJ.lineTo(0.65, 0.72);
      shapeJ.lineTo(0.22, 0.72);
      shapeJ.lineTo(0.22, -0.45);
      shapeJ.absarc(-0.2, -0.45, 0.42, 0, Math.PI, false);
      shapeJ.lineTo(-0.62, -0.15);
      shapeJ.lineTo(-0.32, -0.15);
      shapeJ.lineTo(-0.32, -0.45);
      shapeJ.absarc(-0.2, -0.45, 0.12, Math.PI, 0, true);
      shapeJ.lineTo(-0.08, 0.72);
      shapeJ.lineTo(-0.65, 0.72);
      shapeJ.closePath();

      // Shape for L
      const shapeL = new THREE.Shape();
      shapeL.moveTo(-0.7, 1.1);
      shapeL.lineTo(-0.28, 1.1);
      shapeL.lineTo(-0.28, -0.7);
      shapeL.lineTo(0.72, -0.7);
      shapeL.lineTo(0.72, -1.1);
      shapeL.lineTo(-0.7, -1.1);
      shapeL.closePath();

      return { K: shapeK, A: shapeA, J: shapeJ, L: shapeL };
    };

    const letterShapes = createLetterShapes();
    const extrudeSettings = {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    // Metallic Material (Rich Champagne Gold with high reflections)
    const metallicMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdf88,
      metalness: 0.9,
      roughness: 0.18,
    });

    const letterChars = ['K', 'A', 'J', 'A', 'L'];
    const letterDataList: LetterData[] = [];

    const isMobile = container.clientWidth < 640;
    const spacing = isMobile ? 1.05 : 1.6;
    const baseScale = isMobile ? 0.65 : 1.0;

    letterChars.forEach((char, idx) => {
      const shape = letterShapes[char];
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();

      const mesh = new THREE.Mesh(geom, metallicMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const group = new THREE.Group();
      group.add(mesh);

      const xPos = (idx - 2) * spacing;
      group.position.set(xPos, 0.2, 0);
      group.scale.set(baseScale, baseScale, baseScale);

      // Tag for raycasting
      mesh.userData = { type: 'letter', index: idx, char };

      lettersGroup.add(group);

      letterDataList.push({
        group,
        index: idx,
        char,
        baseX: xPos,
        baseY: 0.2,
        scale: baseScale,
        jumpY: 0,
        jumpVel: 0,
        rotY: 0,
        rotVel: 0,
      });
    });

    // 4. Floating 3D Balloons
    const balloonsGroup = new THREE.Group();
    scene.add(balloonsGroup);

    const balloonColors = [
      0xf43f5e, // Rose
      0xfbbf24, // Amber gold
      0xec4899, // Pink
      0xa855f7, // Purple
      0x06b6d4, // Cyan
      0xff6b81, // Coral
      0x10b981, // Emerald
      0xffd166, // Champagne
    ];

    const balloonList: BalloonData[] = [];
    const balloonGeom = new THREE.SphereGeometry(0.55, 24, 24);
    balloonGeom.scale(1, 1.28, 1); // Egg shape
    const knotGeom = new THREE.ConeGeometry(0.1, 0.12, 12);
    knotGeom.rotateX(Math.PI);

    const stringMaterial = new THREE.LineBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.45,
    });

    const balloonCount = isMobile ? 10 : 16;
    for (let i = 0; i < balloonCount; i++) {
      const color = balloonColors[i % balloonColors.length];
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.15,
        metalness: 0.2,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
      });

      const bMesh = new THREE.Mesh(balloonGeom, mat);
      bMesh.castShadow = true;
      const knotMesh = new THREE.Mesh(knotGeom, mat);
      knotMesh.position.y = -0.72;

      // Wavy string
      const stringPoints = [];
      for (let j = 0; j <= 6; j++) {
        stringPoints.push(
          new THREE.Vector3(Math.sin(j * 0.8) * 0.06, -0.72 - j * 0.25, 0)
        );
      }
      const stringGeom = new THREE.BufferGeometry().setFromPoints(stringPoints);
      const stringLine = new THREE.Line(stringGeom, stringMaterial);

      const group = new THREE.Group();
      group.add(bMesh);
      group.add(knotMesh);
      group.add(stringLine);

      // Random placement around letters
      const angle = (i / balloonCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const radius = isMobile ? 2.5 + Math.random() * 2 : 3.6 + Math.random() * 2.8;
      const posX = Math.cos(angle) * radius;
      const posY = (Math.random() - 0.5) * 3.8;
      const posZ = (Math.random() - 0.5) * 4 - 0.5;

      group.position.set(posX, posY, posZ);
      const bScale = 0.65 + Math.random() * 0.45;
      group.scale.set(bScale, bScale, bScale);

      bMesh.userData = { type: 'balloon', id: i };
      knotMesh.userData = { type: 'balloon', id: i };

      balloonsGroup.add(group);

      balloonList.push({
        mesh: group,
        color,
        initialY: posY,
        speed: 0.3 + Math.random() * 0.4,
        swaySpeed: 0.8 + Math.random() * 1.2,
        swayOffset: Math.random() * Math.PI * 2,
        popped: false,
        popTime: 0,
      });
    }

    // 5. 3D Floating Confetti Particles
    const confettiCount = 140;
    const confettiGroup = new THREE.Group();
    scene.add(confettiGroup);

    const confettiGeom = new THREE.PlaneGeometry(0.12, 0.18);
    const confettiColors = [0xff4081, 0xffd700, 0x00e5ff, 0x76ff03, 0xff9100, 0xe040fb];
    const confettiList: {
      mesh: THREE.Mesh;
      rotVelX: number;
      rotVelY: number;
      fallSpeed: number;
      swayFreq: number;
    }[] = [];

    for (let i = 0; i < confettiCount; i++) {
      const cMat = new THREE.MeshBasicMaterial({
        color: confettiColors[i % confettiColors.length],
        side: THREE.DoubleSide,
      });
      const cMesh = new THREE.Mesh(confettiGeom, cMat);

      cMesh.position.set(
        (Math.random() - 0.5) * 14,
        Math.random() * 12 - 5,
        (Math.random() - 0.5) * 6
      );
      cMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      confettiGroup.add(cMesh);
      confettiList.push({
        mesh: cMesh,
        rotVelX: (Math.random() - 0.5) * 4,
        rotVelY: (Math.random() - 0.5) * 4,
        fallSpeed: 0.6 + Math.random() * 0.9,
        swayFreq: 1 + Math.random() * 2,
      });
    }

    // 6. Interaction & Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let targetCameraRotX = 0;
    let targetCameraRotY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.x = normX;
      mouse.y = normY;

      // Parallax rotation
      targetCameraRotY = normX * 0.22;
      targetCameraRotX = -normY * 0.18;
    };

    const triggerLetterAction = (index: number, clientX: number, clientY: number) => {
      const item = letterDataList[index];
      if (!item) return;

      item.jumpVel = 0.22;
      item.rotVel = 0.35;

      audio.playChime(index);
      triggerLetterConfetti(clientX, clientY);
      setLastInteractedLetter(item.char);

      if (navigator.vibrate) {
        navigator.vibrate(35);
      }
    };

    const triggerBalloonPop = (
      balloonIdx: number,
      clientX: number,
      clientY: number
    ) => {
      const b = balloonList[balloonIdx];
      if (!b || b.popped) return;

      b.popped = true;
      b.popTime = performance.now();
      b.mesh.visible = false;

      audio.playPop();
      setPoppedCount((c) => c + 1);

      const normX = clientX / window.innerWidth;
      const normY = clientY / window.innerHeight;
      triggerConfetti(normX, normY);

      if (navigator.vibrate) {
        navigator.vibrate([25, 30, 45]);
      }

      // Respawn balloon after 4 seconds
      setTimeout(() => {
        b.popped = false;
        b.mesh.visible = true;
        b.mesh.position.y = -5;
        b.mesh.position.x = (Math.random() - 0.5) * 8;
      }, 3800);
    };

    const handleClickOrTap = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        for (const hit of intersects) {
          const ud = hit.object.userData;
          if (ud && ud.type === 'letter') {
            triggerLetterAction(ud.index, clientX, clientY);
            return;
          }
          if (ud && ud.type === 'balloon') {
            triggerBalloonPop(ud.id, clientX, clientY);
            return;
          }
        }
      } else {
        // Ambient confetti click anywhere
        triggerConfetti(clientX / window.innerWidth, clientY / window.innerHeight);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      handleClickOrTap(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const normX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        targetCameraRotY = normX * 0.18;
        targetCameraRotX = -normY * 0.14;
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;

      // Adjust camera distance and letter scale for portrait vs landscape
      if (width < 640) {
        camera.position.z = 12.8;
        lettersGroup.scale.set(0.72, 0.72, 0.72);
      } else if (width < 1024) {
        camera.position.z = 11.5;
        lettersGroup.scale.set(0.9, 0.9, 0.9);
      } else {
        camera.position.z = 10.8;
        lettersGroup.scale.set(1.0, 1.0, 1.0);
      }

      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Camera parallax lerp
      camera.rotation.y += (targetCameraRotY - camera.rotation.y) * 0.05;
      camera.rotation.x += (targetCameraRotX - camera.rotation.x) * 0.05;

      // Letters Idle Floating & Click Bounce
      letterDataList.forEach((item, i) => {
        // Idle gentle wave
        const idleWave = Math.sin(elapsed * 2 + i * 0.8) * 0.12;
        const idleRot = Math.sin(elapsed * 1.5 + i * 0.6) * 0.06;

        // Jump physics
        if (item.jumpVel !== 0 || item.jumpY > 0) {
          item.jumpY += item.jumpVel;
          item.jumpVel -= 0.015; // gravity
          if (item.jumpY <= 0) {
            item.jumpY = 0;
            item.jumpVel = 0;
          }
        }

        // Spin physics
        if (item.rotVel > 0.005) {
          item.rotY += item.rotVel;
          item.rotVel *= 0.92; // friction
        } else {
          item.rotVel = 0;
          item.rotY += (0 - item.rotY) * 0.1;
        }

        item.group.position.y = item.baseY + idleWave + item.jumpY;
        item.group.rotation.y = item.rotY + idleRot;
        item.group.rotation.x = Math.sin(elapsed * 1.8 + i) * 0.04;
      });

      // Balloons floating & swaying
      balloonList.forEach((b) => {
        if (!b.popped) {
          b.mesh.position.y += b.speed * 0.015;
          b.mesh.position.x += Math.sin(elapsed * b.swaySpeed + b.swayOffset) * 0.008;
          b.mesh.rotation.z = Math.sin(elapsed * b.swaySpeed + b.swayOffset) * 0.08;

          // Wrap back to bottom if floated too high
          if (b.mesh.position.y > 5.5) {
            b.mesh.position.y = -5.0;
            b.mesh.position.x = (Math.random() - 0.5) * 8;
          }
        }
      });

      // Confetti falling & tumbling
      confettiList.forEach((c) => {
        c.mesh.position.y -= c.fallSpeed * 0.02;
        c.mesh.position.x += Math.sin(elapsed * c.swayFreq) * 0.01;
        c.mesh.rotation.x += c.rotVelX * 0.01;
        c.mesh.rotation.y += c.rotVelY * 0.01;

        if (c.mesh.position.y < -6.5) {
          c.mesh.position.y = 6.5;
          c.mesh.position.x = (Math.random() - 0.5) * 14;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0b0c14] via-[#141226] to-[#0d0f1a] pt-16 md:pt-20 select-none"
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-pointer touch-none z-10"
        title="Click letters for musical chimes or pop floating balloons!"
      />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Overlay Text */}
      <div className="relative z-20 pointer-events-none text-center px-4 max-w-3xl mb-auto mt-6 md:mt-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="text-xs font-semibold tracking-widest uppercase text-amber-200/90">
            A Royal Birthday Tribute
          </span>
        </div>
        <h1 className="font-['Cinzel'] text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-rose-200 to-amber-300 drop-shadow-md">
          HAPPY BIRTHDAY
        </h1>
      </div>

      {/* Interactive Helper Overlay & Stats */}
      <div className="relative z-20 pointer-events-none text-center px-4 pb-12 mt-auto w-full max-w-xl flex flex-col items-center gap-4">
        {/* Helper Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300/90">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
            <Music className="w-3 h-3 text-rose-400" />
            <span>Click letters for 3D bounce & chimes</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-sm">🎈</span>
            <span>Tap balloons to pop ({poppedCount} popped)</span>
          </div>
        </div>

        {/* Scroll Indicator to Cake Section */}
        <button
          onClick={() => {
            const cakeSection = document.getElementById('cake');
            cakeSection?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="pointer-events-auto mt-2 flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-amber-200 transition-colors focus:outline-none group"
        >
          <span className="tracking-wider uppercase text-[11px] font-medium group-hover:tracking-widest transition-all">
            Blow the Candles
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-amber-300/80 group-hover:text-amber-300" />
        </button>
      </div>
    </section>
  );
};
