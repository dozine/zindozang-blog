"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PostFont } from "@/types/post";
import { POST_FONTS } from "@/lib/constants/post";
import styles from "./fontSelect.module.css";

export default function FontSelect({
  value,
  onChange,
  disabled,
}: {
  value: PostFont;
  onChange: (value: PostFont) => void;
  disabled: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const options = Object.entries(POST_FONTS).map(([slug, font]) => ({
    slug: slug as PostFont,
    title: font.label,
    family: font.family,
  }));
  const selected = Math.max(
    0,
    options.findIndex((option) => option.slug === value)
  );
  const expanded = open && !disabled;
  useEffect(() => {
    if (!expanded) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [expanded]);
  useEffect(() => {
    if (expanded)
      ref.current
        ?.querySelector(`[id="${id}-option-${active}"]`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [expanded, active, id]);
  const choose = (index: number) => {
    onChange(options[index].slug);
    setOpen(false);
  };
  return (
    <div ref={ref} className={styles.control}>
      <button
        type="button"
        role="combobox"
        aria-label="본문 글꼴"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-haspopup="listbox"
        aria-activedescendant={expanded ? `${id}-option-${active}` : undefined}
        className={styles.select}
        disabled={disabled}
        onClick={() => {
          setActive(selected);
          setOpen(!expanded);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setOpen(false);
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            setActive(
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : !expanded
                    ? selected
                    : Math.max(
                        0,
                        Math.min(options.length - 1, active + (event.key === "ArrowDown" ? 1 : -1))
                      )
            );
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (expanded) choose(active);
            else {
              setActive(selected);
              setOpen(true);
            }
          } else if (event.key === "Escape" && expanded) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          } else if (event.key === "Tab") setOpen(false);
        }}
      >
        <span>{options[selected].title}</span>
        <svg
          className={styles.chevron}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {expanded && (
        <div
          id={`${id}-list`}
          role="listbox"
          aria-label="본문 글꼴 목록"
          className={styles.options}
        >
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={option.slug === value}
              id={`${id}-option-${index}`}
              key={option.slug}
              tabIndex={-1}
              className={`${styles.option} ${active === index ? styles.optionActive : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              <span style={{ fontFamily: option.family }}>{option.title}</span>
              <span aria-hidden="true">{option.slug === value ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
