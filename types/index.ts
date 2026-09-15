import * as THREE from 'three';

export type ElementType =
  | 'fire'
  | 'water'
  | 'lightning'
  | 'ice'
  | 'wind'
  | 'soil'
  | 'trees'
  | 'dark'
  | 'light'
  | 'space'
  | 'time'
  | 'robot'
  | 'healing'
  | 'void';

export type StickManMood =
  | 'idle'
  | 'running'
  | 'leaping'
  | 'sparring'
  | 'casting'
  | 'excited'
  | 'celebrating'
  | 'sitting'
  | 'flying'
  | 'floating'
  | 'dueling'
  | 'bullying'
  | 'talking';

export interface StickManDefinition {
  id: ElementType;
  name: string;
  title: string;
  symbol: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  shadowColor: string;
  headPower: string;
  bodyPower: string;
  weaponOrFocus: string;
  personality: string;
  dialogueQuote: string;
  specialMove: string;
  stats: {
    speed: number;
    power: number;
    agility: number;
    elementalMastery: number;
  };
}

export interface StickMan3DCharacter {
  id: string;
  element: ElementType;
  group: THREE.Group;
  bodyGroup: THREE.Group;
  
  // Limbs & Bones for procedural 3D animation
  headMesh: THREE.Mesh;
  eyesMesh: THREE.Mesh;
  torsoMesh: THREE.Mesh;
  powerCoreMesh: THREE.Mesh;
  
  leftArm: {
    shoulder: THREE.Group;
    upper: THREE.Mesh;
    elbow: THREE.Group;
    lower: THREE.Mesh;
    hand: THREE.Mesh;
  };
  rightArm: {
    shoulder: THREE.Group;
    upper: THREE.Mesh;
    elbow: THREE.Group;
    lower: THREE.Mesh;
    hand: THREE.Mesh;
  };
  leftLeg: {
    hip: THREE.Group;
    thigh: THREE.Mesh;
    knee: THREE.Group;
    shin: THREE.Mesh;
    foot: THREE.Mesh;
  };
  rightLeg: {
    hip: THREE.Group;
    thigh: THREE.Mesh;
    knee: THREE.Group;
    shin: THREE.Mesh;
    foot: THREE.Mesh;
  };

  // Elemental Visual FX Objects
  headElementGroup: THREE.Group;
  bodyElementGroup: THREE.Group;
  magicSealMesh: THREE.Mesh;
  handMagicSeal: THREE.Group;
  shadowMesh: THREE.Mesh;
  powerBeamMesh: THREE.Mesh;
  shockwaveMesh: THREE.Mesh;
  hitBoxMesh: THREE.Mesh;
  weaponMesh?: THREE.Object3D;

  // Animation & AI state
  mood: StickManMood;
  animTime: number;
  walkCycle: number;
  castAnimationTime: number;
  targetPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  baseY: number;
  wanderTimer: number;
  dialogue: string;
  districtIndex: number;
  patrolWaypoints: THREE.Vector3[];
  waypointIdx: number;
  isRallyMoving?: boolean;
}

export interface PersonalInfo {
  name: string;
  displayName: string;
  title: string;
  summary: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface ExperienceItem {
  role: string;
  company: string;
  location: string;
  period: string;
  elementAffinity: ElementType;
  description: string;
  highlights: string[];
  techStack: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  elementAffinity: ElementType;
  description: string;
  tech: string[];
  categories: string[];
  link?: string;
  github?: string;
  highlights: string[];
}

export interface SkillItem {
  name: string;
  level: number; // 0-100
  elementAffinity: ElementType;
  category: 'Frontend' | 'Backend' | 'Mobile' | 'Cloud & DevOps' | 'AI & Tools';
  description?: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  period: string;
  description?: string;
}
