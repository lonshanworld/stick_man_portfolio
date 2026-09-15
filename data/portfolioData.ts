import { PersonalInfo, ExperienceItem, ProjectItem, SkillItem, EducationItem } from '../types';

export const PERSONAL_INFO: PersonalInfo = {
  name: 'Lon Shan',
  displayName: 'Lon Shan',
  title: 'Full-Stack & Creative Software Engineer',
  summary:
    'Innovative Software Engineer with 3+ years of expertise architecting high-performance mobile, web, and cloud platforms. Skilled in building resilient real-time systems, offline-first architectures, creative 3D web applications, and AI integrations. Passionate about bringing interactive software to life.',
  location: 'Bangkok 10260, Thailand',
  email: 'lonshan3010@gmail.com',
  phone: '(+66) 0641618200',
  website: 'https://lonshan.com',
  linkedin: 'https://linkedin.com/in/lon-shan-336699db',
  github: 'https://github.com/lonshanworld',
};

export const EXPERIENCES: ExperienceItem[] = [
  {
    role: 'Mid-Level Full-Stack Developer',
    company: 'Singtecs Co., Ltd (Singapore)',
    location: 'Remote',
    period: 'Jan 2024 – Dec 2025',
    elementAffinity: 'lightning',
    description:
      'Engineered scalable enterprise production applications spanning React, Next.js, Flutter, and high-throughput Node.js microservices with NestJS and Express.',
    highlights: [
      'Designed and deployed high-traffic REST/WebSocket APIs with PostgreSQL, MySQL, and MongoDB for internal and clinical platforms.',
      'Delivered cross-platform mobile and web systems with offline-first synchronization and real-time reliability.',
      'Integrated AI conversational assistants and operational automation pipelines that boosted team efficiency by 35%.',
      'Optimized backend queries and client bundles, slashing API latency by 40% and cutting asset load times.',
    ],
    techStack: ['Next.js', 'React', 'Flutter', 'NestJS', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS'],
  },
  {
    role: 'Cross-Platform / Frontend Developer',
    company: 'Smthgood Co. (Singapore)',
    location: 'Remote',
    period: 'Oct 2023 – Jan 2025',
    elementAffinity: 'water',
    description:
      'Spearheaded the architectural migration of an existing Flutter mobile app into an ultra-responsive Next.js e-commerce platform.',
    highlights: [
      'Built merchant seller portals, multi-tier product catalogs, and high-converting checkout flows with smooth animations.',
      'Engineered intelligent API caching and optimistic state management for lightning-quick client interactions.',
      'Managed cloud deployment pipelines across AWS EC2, S3, and CloudFront using automated GitHub Actions CI/CD.',
      'Decreased initial page load time by 45% through dynamic code-splitting and asset compression.',
    ],
    techStack: ['Next.js', 'TypeScript', 'Flutter', 'Tailwind CSS', 'AWS', 'CI/CD', 'REST APIs'],
  },
  {
    role: 'Flutter Mobile Developer',
    company: 'EfficientSoft Co., Ltd',
    location: 'Onsite',
    period: 'Jan 2023 – Aug 2023',
    elementAffinity: 'fire',
    description:
      'Created and shipped QuickFood Rider and QuickFood Merchant applications to the Apple App Store and Google Play Store.',
    highlights: [
      'Engineered live GPS driver tracking and real-time order status feeds via WebSockets and Firebase.',
      'Integrated seamless payment gateway flows, instant customer support chat, and push notification triggers.',
      'Refactored Flutter state layers using BLoC and Riverpod, ensuring 60fps animations across diverse mobile devices.',
    ],
    techStack: ['Flutter', 'Dart', 'WebSockets', 'Google Maps API', 'Firebase', 'iOS / Android'],
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'business-central',
    title: 'Business Central — Smart Retail Platform',
    tagline: 'Multi-portal offline-first POS & retail management ecosystem',
    elementAffinity: 'fire',
    description:
      'Production enterprise retail platform connecting merchants, cashier terminals, and administrators. Built with offline-first transaction queues, sub-millisecond barcode lookups, and Bluetooth BLE receipt printer integration.',
    tech: ['Flutter', 'Go Fiber', 'Next.js', 'PostgreSQL', 'BLE Printing', 'Docker'],
    categories: ['Web', 'Mobile', 'Full-Stack'],
    link: 'https://smartretail.lonshan.com',
    highlights: [
      'Engineered offline transaction queue with automatic conflict resolution upon reconnection.',
      'High-throughput backend service written in Go Fiber delivering 0.8ms average query response.',
      'Custom hardware driver for thermal printers via Bluetooth Low Energy and WebUSB.',
    ],
  },
  {
    id: 'pistil',
    title: "Pistil — Women's Health Platform",
    tagline: 'Telemedicine & pharmacy ecosystem connecting doctors and patients',
    elementAffinity: 'healing',
    description:
      'Comprehensive digital healthcare platform enabling seamless telemedicine video appointments, electronic prescription dispatch, and encrypted patient histories.',
    tech: ['React Native', 'Laravel', 'Express.js', 'MySQL', 'WebSockets'],
    categories: ['Mobile', 'Backend', 'HealthTech'],
    link: 'https://pistil.io',
    highlights: [
      'HIPAA-ready encrypted patient intake workflow and real-time doctor-patient messaging.',
      'Real-time prescription synchronization between clinical dashboard and pharmacy logistics.',
    ],
  },
  {
    id: 'singbox-manager',
    title: 'SingBox Manager — Network Proxy Suite',
    tagline: 'Cross-platform routing utility with real-time speed monitoring',
    elementAffinity: 'lightning',
    description:
      'Desktop & mobile management client for high-performance network tunnels. Features latency telemetry graphs, dynamic rule configuration, and auto-failover nodes.',
    tech: ['Flutter', 'Rust', 'WebSockets', 'Chart.js', 'Linux / macOS'],
    categories: ['Desktop', 'Mobile', 'Systems'],
    highlights: [
      'Rust FFI bridge for microsecond-level packet metrics and memory efficiency.',
      'Dynamic routing rule editor with live visual latency ping heatmaps.',
    ],
  },
  {
    id: 'stickman-world',
    title: 'Elemental Stick Man Realm 3D',
    tagline: 'Interactive 3D WebGL ecosystem with tiny elemental stick figures',
    elementAffinity: 'space',
    description:
      'Cinematic 3D web experience with procedurally rigged stick men who roam, jump, spar, cast elemental spells, and interact with the DOM elements of the website.',
    tech: ['Three.js', 'Next.js', 'TypeScript', 'Web Audio API', 'Tailwind CSS'],
    categories: ['Creative Dev', '3D WebGL', 'Frontend'],
    highlights: [
      'Procedural bone joint kinematics and physics-based particle auras around head & body.',
      'Custom Web Audio synthesizer for zero-latency elemental magic soundscapes.',
    ],
  },
  {
    id: 'smthgood-app',
    title: 'Smthgood — Conscious Fashion Marketplace',
    tagline: 'E-commerce mobile app & seller dashboard with interactive lookbooks',
    elementAffinity: 'water',
    description:
      'Social commerce marketplace promoting sustainable fashion brands. Features interactive lookbook collage builder, personalized style quiz, and seller payout gateway.',
    tech: ['Flutter', 'Next.js', 'Node.js', 'Stripe', 'AWS S3'],
    categories: ['Mobile', 'E-Commerce'],
    highlights: [
      'Interactive drag-and-drop lookbook editor with sticker layering and photo filters.',
      'Over 25,000 active monthly shoppers with 99.9% checkout uptime.',
    ],
  },
  {
    id: 'quickfood-rider',
    title: 'QuickFood — Delivery & Merchant Logistics',
    tagline: 'Hyperlocal food ordering and real-time courier tracking',
    elementAffinity: 'wind',
    description:
      'Two companion mobile apps for delivery riders and restaurant managers featuring live GPS routing, instant audio order alerts, and automated shift payout settlements.',
    tech: ['Flutter', 'Firebase', 'Google Maps SDK', 'WebSockets'],
    categories: ['Mobile', 'Logistics'],
    highlights: [
      'Optimized route dispatch algorithm reducing delivery times by 18%.',
      'Battery-efficient background GPS beacon keeping riders tracked accurately.',
    ],
  },
];

export const SKILLS: SkillItem[] = [
  // Frontend
  { name: 'React / Next.js', level: 96, elementAffinity: 'fire', category: 'Frontend', description: 'SSR, App Router, Server Actions, Performance' },
  { name: 'TypeScript', level: 94, elementAffinity: 'lightning', category: 'Frontend', description: 'Strict typing, Generics, AST manipulation' },
  { name: 'Three.js / WebGL', level: 88, elementAffinity: 'space', category: 'Frontend', description: '3D Scene graph, Shaders, Procedural Meshes' },
  { name: 'Tailwind CSS', level: 95, elementAffinity: 'wind', category: 'Frontend', description: 'Design systems, responsive layout, animations' },
  
  // Mobile
  { name: 'Flutter & Dart', level: 95, elementAffinity: 'water', category: 'Mobile', description: 'Cross-platform iOS/Android, Custom RenderObjects' },
  { name: 'React Native', level: 86, elementAffinity: 'lightning', category: 'Mobile', description: 'Expo, Native Modules, JSI, Reanimated' },

  // Backend
  { name: 'Node.js / NestJS', level: 92, elementAffinity: 'lightning', category: 'Backend', description: 'Microservices, REST, WebSockets, BullMQ' },
  { name: 'Go (Golang)', level: 85, elementAffinity: 'wind', category: 'Backend', description: 'High-speed microservices with Fiber, Goroutines' },
  { name: 'PostgreSQL / MySQL', level: 90, elementAffinity: 'soil', category: 'Backend', description: 'Indexing, Query plans, Relational architecture' },
  { name: 'MongoDB / Redis', level: 88, elementAffinity: 'dark', category: 'Backend', description: 'Document stores, Pub/Sub, Low-latency caching' },

  // Cloud & DevOps
  { name: 'Docker & Containers', level: 89, elementAffinity: 'robot', category: 'Cloud & DevOps', description: 'Multi-stage builds, orchestration' },
  { name: 'AWS Cloud Services', level: 86, elementAffinity: 'space', category: 'Cloud & DevOps', description: 'EC2, S3, CloudFront, Lambda, RDS' },
  { name: 'CI/CD Pipelines', level: 88, elementAffinity: 'time', category: 'Cloud & DevOps', description: 'GitHub Actions, automated tests, zero-downtime deploy' },

  // AI & Creative
  { name: 'LLM & AI Tooling', level: 87, elementAffinity: 'light', category: 'AI & Tools', description: 'Gemini, OpenAI, LangChain, embeddings, agentic workflows' },
  { name: 'Web Audio API', level: 85, elementAffinity: 'healing', category: 'AI & Tools', description: 'Procedural audio synthesis, polyphonic oscillators' },
];

export const EDUCATION: EducationItem[] = [
  {
    degree: 'B.Sc. in Computer Science',
    institution: 'University of Technology',
    period: '2019 – 2023',
    description: 'Specialized in Software Architecture, Distributed Systems, and Human-Computer Interaction.',
  },
];
