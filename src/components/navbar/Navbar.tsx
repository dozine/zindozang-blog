"use client";
import React from "react";
import styles from "./navbar.module.css";
import Link from "next/link";
import ThemeToggle from "../themeToggle/ThemeToggle";
import { signOut, useSession } from "next-auth/react";
import VisitorTracker from "../visitorTracker/visitorTracker";

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  const { status } = useSession();

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          zindozang
        </Link>
        <VisitorTracker />
      </div>
      <div className={styles.links}>
        <Link href="/" className={styles.link}>
          Home
        </Link>
        <Link href="/blog" className={styles.link}>
          Blog
        </Link>
        <Link href="/tags" className={styles.link}>
          Tags
        </Link>
        <Link href="/" className={styles.link}>
          About
        </Link>
        {status === "authenticated" && (
          <>
            <Link href="/write" className={styles.link}>
              Write
            </Link>
            <span className={styles.link} onClick={() => signOut()}>
              Logout
            </span>
          </>
        )}

        <button
          type="button"
          className={styles.burger}
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <span className={styles.line} />
          <span className={styles.line} />
          <span className={styles.line} />
        </button>
        <div className={styles.desktopTheme}>
          <ThemeToggle />
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            className={styles.responsiveMenu}
            aria-label="모바일 메뉴"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                document
                  .querySelector<HTMLButtonElement>(`[aria-controls="mobile-navigation"]`)
                  ?.focus();
              }
            }}
          >
            <Link href="/" className={styles.burgerLink} onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href="/blog" className={styles.burgerLink} onClick={() => setOpen(false)}>
              Blog
            </Link>
            <Link href="/tags" className={styles.burgerLink} onClick={() => setOpen(false)}>
              Tags
            </Link>
            <Link href="/" className={styles.burgerLink} onClick={() => setOpen(false)}>
              About
            </Link>
            {status === "unauthenticated" ? (
              <Link href="/login" className={styles.burgerLink} onClick={() => setOpen(false)}>
                Login
              </Link>
            ) : status === "authenticated" ? (
              <>
                <Link href="/write" className={styles.burgerLink} onClick={() => setOpen(false)}>
                  Write
                </Link>
                <span
                  className={styles.burgerLink}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                >
                  Logout
                </span>
              </>
            ) : null}
            <div className={styles.mobileTheme}>
              <span>화면 테마</span>
              <ThemeToggle />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Navbar;
