import confetti from 'canvas-confetti';

export const triggerConfetti = (x = 0.5, y = 0.5) => {
  confetti({
    particleCount: 70,
    spread: 60,
    origin: { x, y },
    colors: ['#f43f5e', '#fb7185', '#fbbf24', '#f59e0b', '#c084fc', '#e879f9', '#ffffff'],
    ticks: 200,
    gravity: 0.9,
    scalar: 1.1,
    shapes: ['circle', 'square'],
  });
};

export const triggerMassiveConfetti = () => {
  const duration = 3.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 120, zIndex: 9999 };

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() * 0.3 + 0.1 },
      colors: ['#ff007f', '#ffd700', '#ff69b4', '#00ffff', '#ffffff'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() * 0.3 + 0.1 },
      colors: ['#ff4081', '#7c4dff', '#00e5ff', '#ffeb3b'],
    });
  }, 250);
};

export const triggerLetterConfetti = (x: number, y: number) => {
  const normX = Math.max(0.1, Math.min(0.9, x / window.innerWidth));
  const normY = Math.max(0.1, Math.min(0.9, y / window.innerHeight));

  confetti({
    particleCount: 45,
    angle: 90,
    spread: 75,
    origin: { x: normX, y: normY },
    colors: ['#f59e0b', '#fbbf24', '#ec4899', '#f43f5e', '#a855f7'],
    startVelocity: 35,
    gravity: 0.95,
  });
};
