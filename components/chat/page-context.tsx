"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ChatPageContext = {
  path: string;
  page: "home" | "blog" | "blog-post" | "projects" | "project" | "experience" | "tags" | "other";
  slug?: string;
  section?: string;
};

const PageContextContext = createContext<ChatPageContext>({ path: "/", page: "home" });

function derivePage(path: string): Pick<ChatPageContext, "page" | "slug"> {
  if (path === "/") {
    return { page: "home" };
  }

  const segments = path.split("/").filter(Boolean);

  if (segments[0] === "blog") {
    return segments[1] ? { page: "blog-post", slug: segments[1] } : { page: "blog" };
  }

  if (segments[0] === "projects") {
    return segments[1] ? { page: "project", slug: segments[1] } : { page: "projects" };
  }

  if (segments[0] === "experience") {
    return { page: "experience" };
  }

  if (segments[0] === "tags") {
    return { page: "tags", slug: segments[1] };
  }

  return { page: "other" };
}

export function PageContextProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [observed, setObserved] = useState<{ path: string; section?: string }>({ path: "" });

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-chat-section]"));

    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target instanceof HTMLElement) {
          setObserved({ path: pathname ?? "/", section: visible.target.dataset.chatSection });
        }
      },
      { threshold: [0.25, 0.5], rootMargin: "-20% 0px -30% 0px" },
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [pathname]);

  const value = useMemo<ChatPageContext>(() => {
    const derived = derivePage(pathname ?? "/");
    const section = observed.path === (pathname ?? "/") ? observed.section : undefined;
    return { path: pathname ?? "/", ...derived, section };
  }, [pathname, observed]);

  return <PageContextContext.Provider value={value}>{children}</PageContextContext.Provider>;
}

export function usePageContext() {
  return useContext(PageContextContext);
}
