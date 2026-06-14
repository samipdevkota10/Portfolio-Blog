import { firestore } from "@/lib/firebase/admin";
import { htmlToTiptapJson, tiptapToHtml, tiptapToText } from "@/lib/content/richtext";
import { slugify } from "@/lib/utils";

type ProjectSeed = {
  title: string;
  summary: string;
  role: string;
  technologies: string[];
  impact: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
};

type ExperienceSeed = {
  title: string;
  company: string;
  location: string;
  summary: string;
  bullets: string[];
  technologies: string[];
  period: string;
  startDate: Date;
  endDate: Date | null;
  featured?: boolean;
};

const projects: ProjectSeed[] = [
  {
    title: "MailLens — AI Search & Analytics Platform",
    summary:
      "AI-powered search platform for large-scale marketing email datasets, enabling semantic search and grounded QA over unstructured data.",
    role: "Backend & AI Engineer",
    technologies: ["FastAPI", "PostgreSQL", "pgvector", "React"],
    impact: [
      "Built an AI-powered search platform for large-scale marketing email datasets, enabling semantic search and grounded QA over unstructured data.",
      "Implemented hybrid retrieval (PostgreSQL FTS + pgvector), significantly improving search relevance and enabling natural language querying.",
      "Designed FastAPI endpoints for semantic search, dataset exploration, and AI-assisted insights generation.",
      "Developed extraction pipelines to identify campaign patterns, promotions, and content trends from large datasets.",
    ],
    featured: true,
  },
  {
    title: "Multi-Agent Disruption Response Planner",
    summary:
      "First-place hackathon-winning multi-agent AI system that orchestrates workflows for signal intake, scenario generation, constraint modeling, and decision optimization.",
    role: "Full-Stack & AI Engineer",
    technologies: ["Python", "FastAPI", "Next.js", "LangGraph", "AWS Bedrock", "PostgreSQL"],
    impact: [
      "Won 1st place at the hackathon.",
      "Built a multi-agent AI system orchestrating workflows for signal intake, scenario generation, constraint modeling, and decision optimization.",
      "Integrated LLM-based reasoning with structured backend pipelines to generate explainable, auditable recommendations.",
      "Designed full-stack architecture supporting interactive scenario analysis and persistent workflow state management.",
    ],
    featured: true,
  },
  {
    title: "Real-Time Chat Application",
    summary:
      "Low-latency messaging backend built with FastAPI WebSockets and Redis Pub/Sub for reliable, high-throughput real-time communication.",
    role: "Backend Engineer",
    technologies: ["Python", "FastAPI", "Redis", "PostgreSQL"],
    impact: [
      "Architected a low-latency messaging backend using FastAPI WebSockets for real-time communication.",
      "Implemented Redis Pub/Sub for high-throughput message fanout, ensuring reliable delivery under concurrent load.",
      "Designed asynchronous PostgreSQL data models for chat persistence, user presence, and metadata tracking.",
      "Focused on scalability, concurrency handling, and backend reliability through performance testing and optimization.",
    ],
    featured: true,
  },
];

const experiences: ExperienceSeed[] = [
  {
    title: "Software Engineer",
    company: "Backstroke Inc",
    location: "Indianapolis, IN",
    summary:
      "Building scalable backend systems and applied-AI services — optimizing production APIs, large-scale data pipelines, and semantic retrieval.",
    bullets: [
      "Optimized a critical Rails API endpoint by restructuring database queries, reducing SQL calls from 226 to 2 and improving response latency from 30s to 0.3s (~100x performance gain).",
      "Built and deployed high-performance FastAPI services processing 800K+ marketing emails, enabling scalable ingestion, analysis, and downstream AI model training.",
      "Designed scalable data pipelines streaming 1M+ PostgreSQL records to object storage, supporting analytics and ML workflows with improved throughput and reliability.",
      "Developed a parallelized Playwright-based scraping system collecting structured data from 100K+ websites for training and evaluation datasets.",
      "Engineered pgvector-based semantic retrieval systems enabling fast, accurate search across large-scale marketing datasets using hybrid vector + keyword retrieval.",
      "Strengthened production security by implementing token redaction in logs, reducing risk of credential exposure in distributed systems.",
    ],
    technologies: ["Ruby on Rails", "FastAPI", "Python", "PostgreSQL", "pgvector", "Playwright", "AWS"],
    period: "June 2025 – Present",
    startDate: new Date(Date.UTC(2025, 5, 1)),
    endDate: null,
    featured: true,
  },
  {
    title: "Teaching Assistant",
    company: "DePauw University – Computer Science Department",
    location: "Greencastle, IN",
    summary:
      "Supported instruction for Algorithmic Foundations of Computation, mentoring 60 students in functional programming and algorithmic problem-solving.",
    bullets: [
      "Supported instruction for Algorithmic Foundations of Computation (60 students), covering functional programming, MapReduce, and computational models.",
      "Mentored students in Scala, ReasonML, and algorithmic problem-solving, improving comprehension and engagement.",
      "Led weekly problem-solving sessions, contributing to a 100% assignment completion rate across the class.",
    ],
    technologies: ["Scala", "ReasonML", "MapReduce"],
    period: "August 2024 – January 2025",
    startDate: new Date(Date.UTC(2024, 7, 1)),
    endDate: new Date(Date.UTC(2025, 0, 31)),
    featured: true,
  },
];

function bulletsToHtml(intro: string, bullets: string[]): string {
  const introHtml = intro.trim() ? `<p>${intro.trim()}</p>` : "";
  const items = bullets.map((bullet) => `<li>${bullet}</li>`).join("");
  return `${introHtml}<ul>${items}</ul>`;
}

async function upsertBySlug(
  db: FirebaseFirestore.Firestore,
  collection: string,
  slug: string,
  values: Record<string, unknown>,
) {
  const existing = await db.collection(collection).where("slug", "==", slug).limit(1).get();
  const now = new Date();
  const ref = existing.docs[0]?.ref ?? db.collection(collection).doc();
  const createdAt = existing.docs[0]?.get("createdAt") ?? now;
  await ref.set({ ...values, slug, updatedAt: now, createdAt }, { merge: true });
  return { id: ref.id, created: existing.empty };
}

async function main() {
  if (!firestore) {
    throw new Error("Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT.");
  }

  for (const project of projects) {
    const slug = slugify(project.title);
    const bodyJson = htmlToTiptapJson(bulletsToHtml(project.summary, project.impact));
    const result = await upsertBySlug(firestore, "projects", slug, {
      title: project.title,
      summary: project.summary,
      bodyJson,
      bodyHtml: tiptapToHtml(bodyJson),
      bodyText: tiptapToText(bodyJson),
      role: project.role,
      technologies: project.technologies,
      impact: project.impact,
      githubUrl: project.githubUrl ?? null,
      liveUrl: project.liveUrl ?? null,
      coverImage: null,
      status: "published",
      featured: project.featured ?? true,
      publishedAt: new Date(),
    });
    console.log(`project ${result.created ? "created" : "updated"}: ${project.title} (${slug})`);
  }

  for (const experience of experiences) {
    const slug = slugify(`${experience.title}-${experience.company}`);
    const bodyJson = htmlToTiptapJson(bulletsToHtml(experience.summary, experience.bullets));
    const result = await upsertBySlug(firestore, "Experiences", slug, {
      title: experience.title,
      company: experience.company,
      location: experience.location,
      summary: experience.summary,
      bodyJson,
      bodyHtml: tiptapToHtml(bodyJson),
      bodyText: tiptapToText(bodyJson),
      technologies: experience.technologies,
      featured: experience.featured ?? true,
      period: experience.period,
      startDate: experience.startDate,
      endDate: experience.endDate,
    });
    console.log(
      `experience ${result.created ? "created" : "updated"}: ${experience.title} @ ${experience.company} (${slug})`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
