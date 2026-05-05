/**
 * Edit this file to update portfolio content. Everything in the world that talks
 * about the user's career reads from here. Keep it in sync with your résumé.
 */

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  building: string; // display label on the in-world building
  npcName: string;
  pitch: string;
  highlights: string[];
}

export interface Skill {
  id: string;
  category: "language" | "framework" | "ai" | "infra" | "data";
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  totem: string; // visible label
  blurb: string;
}

export interface Project {
  id: string;
  name: string;
  blurb: string;
  url?: string;
  stack: string[];
}

export const WORK: WorkExperience[] = [
  {
    id: "current",
    company: "Current Role",
    role: "Full-Stack + AI/ML Engineer",
    period: "Present",
    building: "Main Hall",
    npcName: "Past-Self (Today)",
    pitch:
      "Currently shipping AI-powered features on a typescript + python stack. Edit src/data/portfolio.ts to fill this in.",
    highlights: [
      "Replace this bullet with a concrete shipped feature.",
      "Replace this bullet with a metric-backed win.",
      "Replace this bullet with a system you designed end-to-end.",
    ],
  },
  {
    id: "prev_1",
    company: "Previous Company",
    role: "Software Engineer",
    period: "20XX – 20XX",
    building: "South Wing",
    npcName: "Architect Emeritus",
    pitch:
      "Worked on (describe scope). Edit src/data/portfolio.ts. Keep it short — the dialog box wraps.",
    highlights: [
      "Concrete project A.",
      "Concrete project B.",
      "Concrete project C.",
    ],
  },
  {
    id: "prev_2",
    company: "Earlier Company",
    role: "Junior Engineer",
    period: "20XX – 20XX",
    building: "Old Workshop",
    npcName: "Mentor",
    pitch:
      "First professional role; learned the ropes of (describe). Edit src/data/portfolio.ts.",
    highlights: ["Project A.", "Project B."],
  },
];

export const SKILLS: Skill[] = [
  { id: "ts", category: "language", name: "TypeScript", level: 5, totem: "TS", blurb: "Daily-driver. Strict mode or it didn't happen." },
  { id: "py", category: "language", name: "Python", level: 5, totem: "PY", blurb: "Backends, ML pipelines, sharp tools." },
  { id: "go", category: "language", name: "Go", level: 3, totem: "GO", blurb: "Reach for it when latency matters." },
  { id: "react", category: "framework", name: "React", level: 5, totem: "⚛", blurb: "Hooks, suspense, server components, the works." },
  { id: "node", category: "framework", name: "Node.js", level: 5, totem: "⬢", blurb: "API services and toolchains." },
  { id: "fastapi", category: "framework", name: "FastAPI", level: 4, totem: "⚡", blurb: "Pydantic-typed endpoints and async I/O." },
  { id: "pytorch", category: "ai", name: "PyTorch", level: 4, totem: "🔥", blurb: "Training, fine-tuning, inference." },
  { id: "llm", category: "ai", name: "LLM apps", level: 5, totem: "🧠", blurb: "RAG, evals, agentic tool-use." },
  { id: "aws", category: "infra", name: "AWS", level: 4, totem: "☁", blurb: "Lambda, ECS, RDS, the lot." },
  { id: "docker", category: "infra", name: "Docker", level: 5, totem: "🐳", blurb: "If it builds locally, it builds in CI." },
  { id: "postgres", category: "data", name: "Postgres", level: 4, totem: "🐘", blurb: "Indexes, EXPLAIN, never trust ORMs blindly." },
];

export const PROJECTS: Project[] = [
  {
    id: "proj_1",
    name: "Open-Source Side Quest",
    blurb: "Replace with a project description.",
    url: "https://github.com",
    stack: ["TypeScript", "Phaser", "Vite"],
  },
  {
    id: "proj_2",
    name: "AI Side Quest",
    blurb: "Replace with an AI/ML project description.",
    stack: ["Python", "PyTorch", "FastAPI"],
  },
];
