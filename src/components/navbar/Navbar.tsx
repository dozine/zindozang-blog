"use client";
import React from "react";
import styles from "./navbar.module.css";
import Link from "next/link";
import ThemeToggle from "../themeToggle/ThemeToggle";
import { useSession } from "next-auth/react";

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  const { status } = useSession();

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.logo}>
        zindozang
      </Link>
      <div className={styles.links}>
        <Link href="/tags" className={styles.link}>
          Tags
        </Link>
        <Link href="/" className={styles.link}>
          About
        </Link>
        {status === "unauthenticated" ? (
          <Link href="/login" className={styles.link}>
            Login
          </Link>
        ) : (
          <>
            <Link href="/write" className={styles.link}>
              Write
            </Link>
            <Link href="/logout" className={styles.link}>
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
                <Link href="/logout" className={styles.burgerLink} onClick={() => setOpen(false)}>
                  Logout
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
