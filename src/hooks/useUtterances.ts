"use client";
import { useEffect, useState, useRef } from "react";

const UTTERANCES_CONTAINER_ID = "comments-container";

export function useUtterances(repo: string, issueTerm: string): boolean {
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsDark(theme === "dark");
  }, []);

  useEffect(() => {
    if (!containerRef.current) {
      containerRef.current = document.getElementById(UTTERANCES_CONTAINER_ID);
    }

    const container = containerRef.current;
    if (!container) return;
    const existingScript = container.querySelector("script[src='https://utteranc.es/client.js']");
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.setAttribute("repo", repo);
    script.setAttribute("issue-term", issueTerm);
    script.setAttribute("theme", isDark ? "github-dark" : "github-light");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    container.appendChild(script);
  }, [isDark, repo, issueTerm]);

  return isDark;
}
