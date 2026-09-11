export interface MemoryItem {
  id: string;
  title: string;
  date: string;
  caption: string;
  image: string;
  tag: string;
  color: string;
}

export interface LetterMeshState {
  letter: string;
  index: number;
  rotationY: number;
  targetRotationY: number;
  scale: number;
  targetScale: number;
  bouncing: boolean;
}

export interface CandleState {
  id: number;
  x: number;
  z: number;
  lit: boolean;
  smokeOpacity: number;
}
