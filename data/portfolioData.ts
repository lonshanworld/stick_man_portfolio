import { PersonalInfo, ExperienceItem, ProjectItem, SkillItem, EducationItem } from '../types';

export const PERSONAL_INFO: PersonalInfo = {
  name: 'Lon Shan',
  displayName: 'Lon Shan',
  title: 'Full-Stack Developer',
  summary:
    'Full-stack developer with 3+ years of working experience building and maintaining production web and mobile applications. Experienced in delivering projects from initial development through deployment, designing APIs and databases, and using AI-assisted development workflows to improve productivity and software quality.',
  location: 'Bangkok 10260, Thailand',
  email: 'lonshan3010@gmail.com',
  phone: '+66 64 161 8200',
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
      'Developed production web and mobile applications using React, Next.js, React Native, WordPress and WooCommerce, with backend services in NestJS, Express.js and Laravel.',
    highlights: [
      'Designed and implemented APIs, MySQL, MongoDB and PostgreSQL database schemas, and workflows for internal tools and clinical platforms.',
      'Delivered end-to-end features across web and mobile applications with consistent data integration.',
      'Integrated AI-powered chat and automation features into internal tools and systems.',
      'Maintained production systems through debugging, testing, performance tuning and feature enhancements.',
    ],
    techStack: ['React', 'Next.js', 'React Native', 'WordPress', 'WooCommerce', 'NestJS', 'Express.js', 'Laravel', 'MySQL', 'MongoDB', 'PostgreSQL'],
  },
  {
    role: 'Cross-Platform / Frontend Developer',
    company: 'Smthgood Co. (Singapore)',
    location: 'Remote',
    period: 'Oct 2023 – Jan 2025',
    elementAffinity: 'water',
    description:
      'Migrated a Flutter mobile application to a scalable Next.js web platform and built seller dashboards and administration systems.',
    highlights: [
      'Improved workflows and usability across seller dashboards and administration systems.',
      'Integrated backend APIs, improved data flow, and contributed to system architecture and performance optimization.',
      'Managed deployment pipelines and AWS infrastructure using CI/CD.',
    ],
    techStack: ['Flutter', 'Next.js', 'REST APIs', 'AWS', 'CI/CD'],
  },
  {
    role: 'Mobile Developer',
    company: 'EfficientSoft Co., Ltd',
    location: 'Onsite',
    period: 'Jan 2023 – Aug 2023',
    elementAffinity: 'fire',
    description:
      'Built QuickFood Rider and QuickFood Merchant from scratch using Flutter and published the applications on Google Play and the App Store.',
    highlights: [
      'Implemented authentication, order management, support messaging and delivery navigation.',
      'Integrated APIs for payments, messaging and platform services.',
      'Added location tracking and real-time WebSocket communication; optimized performance and implemented deep linking.',
    ],
    techStack: ['Flutter', 'Dart', 'WebSockets', 'iOS / Android'],
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'business-central',
    title: 'Business Central — Multi-Tenant Merchant Operations Platform',
    tagline: 'Five connected apps for merchant operations, POS and retail management',
    elementAffinity: 'fire',
    description:
      'Built a multi-tenant merchant operations platform spanning a Go Fiber backend, Next.js admin, merchant PWA and marketing apps, and a Flutter client. Covers POS, catalog, inventory, purchasing, repairs, services and financial reporting, with tenant-scoped permissions and PostgreSQL row-level security.',
    tech: ['Go Fiber', 'PostgreSQL', 'Next.js', 'React', 'TypeScript', 'Flutter', 'Drift / SQLite', 'IndexedDB', 'GitHub Actions', 'Cloudflare'],
    categories: ['Web', 'Mobile', 'Full-Stack'],
    link: 'https://smartretail.lonshan.com',
    highlights: [
      'Designed the backend with Hexagonal Architecture / DDD and OpenAPI / Swagger. Inventory uses canonical movement ledgers, FIFO costing and allocations.',
      'Integrated Flutter WebView with Drift / SQLite, scanning and Bluetooth ESC/POS printing.',
      'ONLINE sync covers selected workflows; broader reconciliation remains partial. The .env-selected FULLY_OFFLINE mode supports local retail without backend access or sync; embedded repairs and services remain pending.',
      'Added online, permission-scoped, quota-controlled read-only merchant AI queries and Telegram ordering.',
      'Built public demos and ROI tools, with a separate receptionist for visitor-confirmed Google Calendar bookings without merchant-data access. Stored media in SeaweedFS.',
    ],
  },
  {
    id: 'pistil',
    title: "Pistil — Women's Health Platform",
    tagline: 'Mobile and web platforms for customers, clinics, pharmacies and administrators',
    elementAffinity: 'healing',
    description:
      'Contributed to frontend and full-stack development across mobile and web platforms. Built interfaces for customer, clinic, pharmacy and administration systems, and developed and integrated APIs to improve workflows and data handling.',
    tech: ['Laravel', 'React Native', 'Express.js'],
    categories: ['Web', 'Mobile', 'Full-Stack', 'HealthTech'],
    link: 'https://pistil.io',
    highlights: [
      'Built interfaces across customer, clinic, pharmacy and administration systems.',
      'Developed and integrated APIs, improving system workflows and data handling.',
    ],
  },
  {
    id: 'football-ai',
    title: 'Football-AI — Hybrid Prediction Pipeline',
    tagline: 'Tabular machine learning and fine-tuned LLMs for contextual match forecasts',
    elementAffinity: 'lightning',
    description:
      'Developed a hybrid prediction pipeline combining XGBoost tabular models with fine-tuned LLMs for qualitative match analysis. Built a FastAPI backend with automated scraping, a Parquet-based feature store, and a responsive Vue.js dashboard for real-time prediction visualization.',
    tech: ['Vue.js', 'Python', 'FastAPI', 'Vite', 'Parquet', 'XGBoost', 'Qwen-3.5-2B (LoRA)'],
    categories: ['Web', 'Full-Stack', 'AI / ML'],
    highlights: [
      'Combined XGBoost tabular predictions with fine-tuned LLM analysis.',
      'Automated scraping and used a Parquet-based feature store for efficient data processing.',
      'Implemented Qwen-3.5-2B LoRA inference to generate contextual match forecasts.',
      'Designed a responsive Vue.js dashboard for real-time prediction visualization.',
    ],
  },
  {
    id: 'stickman-world',
    title: 'Interactive 3D Stickman World — Developer Portfolio',
    tagline: 'Responsive developer portfolio with an interactive elemental Three.js world',
    elementAffinity: 'space',
    description:
      'Built a responsive Next.js portfolio with filterable projects, expandable notes, experience, skills and contact links. Integrated an interactive Three.js world with 28 roaming stickman characters across 14 elemental types and an AI-opponent fighting arena.',
    tech: ['Next.js', 'React', 'TypeScript', 'Three.js', 'Framer Motion', 'Tailwind CSS', 'Web Audio API'],
    categories: ['Web', 'Creative Dev', '3D WebGL', 'Frontend'],
    link: 'https://lonshan.com',
    highlights: [
      'Implemented elemental themes, 42 spells, procedural 3D effects, character animations and synthesized audio.',
      'Built an AI-opponent fighting arena with movement, melee attacks, spells, health, energy, cooldowns, shields and status effects.',
      'Added a keyword-based conversation guide, saved dark/light preferences, audio controls and accessibility features.',
      'Deferred 3D initialization, loaded the arena separately, and configured search metadata, social previews, a sitemap and structured profile data.',
    ],
  },
  {
    id: 'quickfood-rider',
    title: 'QuickFood — Food Delivery & Merchant Applications',
    tagline: 'Flutter applications for food delivery riders and merchants',
    elementAffinity: 'wind',
    description:
      'Built Flutter applications for food delivery riders and merchants, covering authentication, order management, messaging, delivery navigation and real-time location tracking. Published QuickFood Rider and QuickFood Merchant on Google Play and the App Store.',
    tech: ['Flutter'],
    categories: ['Mobile', 'Logistics'],
    link: 'https://apps.apple.com/us/app/quick-food-merchant/id6477524082',
    highlights: [
      'Implemented authentication, order management, support messaging and delivery navigation.',
      'Integrated APIs for payments, messaging and platform services.',
      'Added location tracking and real-time WebSocket communication; optimized performance and implemented deep linking.',
    ],
  },
];

export const SKILLS: SkillItem[] = [
  { name: 'React / Next.js', level: 96, elementAffinity: 'fire', category: 'Frontend', description: 'TypeScript, JavaScript, production web applications' },
  { name: 'Tailwind CSS / Bootstrap', level: 95, elementAffinity: 'wind', category: 'Frontend', description: 'Responsive interfaces and layouts' },
  { name: 'WordPress / WooCommerce', level: 90, elementAffinity: 'soil', category: 'Frontend', description: 'Web and commerce applications' },
  { name: 'Flutter & Dart', level: 95, elementAffinity: 'water', category: 'Mobile', description: 'Cross-platform applications, Drift / SQLite' },
  { name: 'React Native', level: 86, elementAffinity: 'lightning', category: 'Mobile', description: 'Production mobile applications and API integration' },
  { name: 'Programming languages', level: 90, elementAffinity: 'fire', category: 'Backend', description: 'TypeScript, JavaScript, Dart, Go, PHP, Python, Java' },
  { name: 'Node.js / NestJS / Express.js', level: 92, elementAffinity: 'lightning', category: 'Backend', description: 'APIs and backend services' },
  { name: 'Go Fiber / Laravel', level: 85, elementAffinity: 'wind', category: 'Backend', description: 'Go, PHP, API and database design' },
  { name: 'Python / Flask / FastAPI', level: 85, elementAffinity: 'light', category: 'Backend', description: 'Python backend services and data processing' },
  { name: 'Databases & storage', level: 90, elementAffinity: 'soil', category: 'Backend', description: 'PostgreSQL, MySQL, MongoDB, SQLite, Prisma ORM, Drift, IndexedDB' },
  { name: 'DevOps & infrastructure', level: 89, elementAffinity: 'robot', category: 'Cloud & DevOps', description: 'Docker, Nginx, Redis, PM2, systemd' },
  { name: 'Cloud & hosting', level: 86, elementAffinity: 'space', category: 'Cloud & DevOps', description: 'AWS EC2 / S3 / Lambda, Firebase, Cloudflare, Vercel, Render' },
  { name: 'CI/CD & Linux VPS', level: 88, elementAffinity: 'time', category: 'Cloud & DevOps', description: 'GitHub Actions, GitLab CI, DigitalOcean, OVH, IONOS' },
  { name: 'XGBoost / LLM fine-tuning', level: 87, elementAffinity: 'light', category: 'AI & Tools', description: 'Tabular models, LoRA, contextual match analysis' },
  { name: 'Parquet', level: 85, elementAffinity: 'dark', category: 'AI & Tools', description: 'Feature stores and efficient data processing' },
  { name: 'AI-assisted development', level: 87, elementAffinity: 'healing', category: 'AI & Tools', description: 'Development workflows, productivity and software quality' },
];

export const EDUCATION: EducationItem[] = [
  {
    degree: 'B.Sc. (Hons) Computing',
    institution: 'KMD University (NCC Education)',
    period: '2023 – 2025',
  },
];

export const LANGUAGES = [
  { name: 'Myanmar', proficiency: 'Native' },
  { name: 'English', proficiency: 'C1' },
  { name: 'Japanese', proficiency: 'N5' },
];
