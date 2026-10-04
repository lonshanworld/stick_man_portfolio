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
      'Built a retail management system from scratch for merchants, staff, and administrators, with POS workflows, dashboards, and backend services. It supports offline-first sales, Bluetooth thermal printing, and AI-assisted business queries.',
    tech: ['Flutter', 'Go Fiber', 'Next.js', 'PostgreSQL', 'BLE Printing', 'Docker'],
    categories: ['Web', 'Mobile', 'Full-Stack'],
    link: 'https://smartretail.lonshan.com',
    highlights: [
      'Offline-first local storage and a sync queue support sales in unreliable network conditions.',
      'Bluetooth Classic and BLE thermal printing with configurable formatting and layouts.',
      'AI-assisted business features use structured data queries and context-based responses.',
    ],
  },
  {
    id: 'pistil',
    title: "Pistil — Women's Health Platform",
    tagline: 'Telemedicine & pharmacy ecosystem connecting doctors and patients',
    elementAffinity: 'healing',
    description:
      'Contributed to frontend and full-stack development across a women’s health platform for customers, clinics, pharmacies, and administrators. Built interfaces, integrated APIs, and improved workflows and data handling across web and mobile.',
    tech: ['React Native', 'Laravel', 'Express.js', 'MySQL', 'WebSockets'],
    categories: ['Mobile', 'Backend', 'HealthTech'],
    link: 'https://pistil.io',
    highlights: [
      'Built user interfaces for customer, clinic, pharmacy, and admin systems.',
      'Integrated APIs and improved system workflows and data handling.',
    ],
  },
  {
    id: 'singbox-manager',
    title: 'SingBox Manager — Network Proxy Suite',
    tagline: 'Cross-platform routing utility with real-time speed monitoring',
    elementAffinity: 'lightning',
    description:
      'Built a lightweight Go service for VPN server management, with configuration generation and client management designed for low-resource VPS deployments.',
    tech: ['Flutter', 'Rust', 'WebSockets', 'Chart.js', 'Linux / macOS'],
    categories: ['Desktop', 'Mobile', 'Systems'],
    highlights: [
      'Generates VPN configurations and supports client management.',
      'Designed for deployment on low-resource VPS instances.',
    ],
  },
  {
    id: 'stickman-world',
    title: 'Elemental Stick Man Realm 3D',
    tagline: 'Browser-based action game with elemental fighters and a living 3D world',
    elementAffinity: 'space',
    description:
      'Developed a browser-based 3D game world inside the portfolio. Elemental stick figures roam and spar; visitors can choose fighters, battle AI opponents, and cast character-specific spells. Built custom character animation, real-time combat systems, and procedural spell effects with Three.js.',
    tech: ['Three.js', 'Next.js', 'TypeScript', 'Web Audio API', 'Tailwind CSS'],
    categories: ['Creative Dev', '3D WebGL', 'Frontend'],
    highlights: [
      'Open-world simulation with 28 roaming characters across 14 elements, with movement, dialogue, duels, and other ambient behaviors.',
      'Choose a fighter and battle AI opponents in a real-time arena using movement, jumps, punches, kicks, and elemental spells.',
      'Combat includes health and energy, spell cooldowns, shields, status effects, and powerful character transformations.',
      'Each element has its own spell set, custom 3D effects, character animations, and synthesized audio.',
      'AI-driven character dialogue and element-based themes connect the game world to the portfolio sections.',
    ],
  },
  {
    id: 'smthgood-app',
    title: 'Smthgood — Conscious Fashion Marketplace',
    tagline: 'E-commerce mobile app & seller dashboard with interactive lookbooks',
    elementAffinity: 'water',
    description:
      'Migrated Smthgood’s Flutter mobile app to a scalable Next.js web platform, building seller dashboards and admin tools while improving API integration, data flow, and deployment.',
    tech: ['Flutter', 'Next.js', 'Node.js', 'Stripe', 'AWS S3'],
    categories: ['Mobile', 'E-Commerce'],
    highlights: [
      'Built seller dashboards and admin systems with improved workflows and usability.',
      'Integrated frontend features with backend APIs and improved data flow.',
      'Managed AWS infrastructure and deployment pipelines with CI/CD.',
    ],
  },
  {
    id: 'quickfood-rider',
    title: 'QuickFood — Delivery & Merchant Logistics',
    tagline: 'Hyperlocal food ordering and real-time courier tracking',
    elementAffinity: 'wind',
    description:
      'Built the QuickFood Rider and Merchant Flutter apps from scratch and shipped them to the App Store and Google Play. The apps support authentication, order management, support messaging, payments, delivery navigation, and real-time location updates.',
    tech: ['Flutter', 'Firebase', 'Google Maps SDK', 'WebSockets'],
    categories: ['Mobile', 'Logistics'],
    highlights: [
      'Integrated backend APIs for payments, chat, and platform services.',
      'Implemented delivery location tracking and real-time communication with WebSockets.',
      'Optimized app performance and added deep linking for navigation.',
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
