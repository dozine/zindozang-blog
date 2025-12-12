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
            <Link href="/logout" className={styles.link} onClick={() => signOut()}>
              Logout
            </Link>
          </>
        )}

        <div className={styles.burger} onClick={() => setOpen(!open)}>
          <div className={styles.line}></div>
          <div className={styles.line}></div>
          <div className={styles.line}></div>
        </div>
        <ThemeToggle />
        {open && (
          <div className={styles.responsiveMenu}>
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
            ) : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
