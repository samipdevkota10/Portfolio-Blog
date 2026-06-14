import { absoluteUrl } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.email,
    jobTitle: "Software Engineer",
    sameAs: [siteConfig.socialLinks.github, siteConfig.socialLinks.linkedin],
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.location,
    },
  };
}

export function articleJsonLd({
  title,
  description,
  publishedAt,
  slug,
}: {
  title: string;
  description: string;
  publishedAt: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: {
      "@type": "Person",
      name: siteConfig.name,
    },
    mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
  };
}

export function projectJsonLd({
  title,
  description,
  slug,
}: {
  title: string;
  description: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description,
    url: absoluteUrl(`/projects/${slug}`),
    creator: {
      "@type": "Person",
      name: siteConfig.name,
    },
  };
}
