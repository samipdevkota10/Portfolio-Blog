export const siteConfig = {
  name: "Samip Devkota",
  title: "Software Engineer Focused on Backend Systems and Applied AI",
  description:
    "Portfolio of Samip Devkota, a software engineer building scalable APIs, data pipelines, and retrieval-backed AI systems.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "samip.devkota@gmail.com",
  location: "Indiana, United States",
  socialLinks: {
    github: "https://github.com/samipdevkota",
    linkedin: "https://www.linkedin.com/in/samip-devkota/",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Writing" },
    { href: "/#projects", label: "Projects" },
    { href: "/#experience", label: "Experience" },
  ],
  adminEmails: (process.env.ADMIN_EMAILS ?? "me@samipdevkota.com")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
} as const;

export type SiteConfig = typeof siteConfig;
