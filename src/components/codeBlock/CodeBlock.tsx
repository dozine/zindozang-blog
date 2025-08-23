"use client";

import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

interface CodeBlockProps {
  language?: string;
  children: string;
  isDark?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  language = "",
  children,
  isDark = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <span
      style={{
        display: "block",
        position: "relative",
        margin: "24px 0",
        width: "100%",
        maxWidth: "100%",
        borderRadius: "12px",
        boxShadow: isDark
          ? "0 10px 25px rgba(0, 0, 0, 0)"
          : "0 10px 25px rgba(0, 0, 0, 0)",
        overflowX: "hidden",
      }}
    >
      <SyntaxHighlighter
        style={isDark ? vscDarkPlus : oneLight}
        language={language || "text"}
        PreTag="pre"
        showLineNumbers={true}
        wrapLines={false}
        customStyle={{
          display: "block",
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          borderRadius: "12px",
          fontSize: "12px",
          lineHeight: "1.5",
          padding: "60px 20px 20px 20px",
          margin: 0,

          background: "lightgray",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
            whiteSpace: "pre",
            wordBreak: "normal",
          },
        }}
      >
        {children}
      </SyntaxHighlighter>

      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40px",
          background: "gray",
          borderRadius: "12px 12px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        <span style={{ display: "flex", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#ff5f56",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#ffbd2e",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#27ca3f",
              display: "inline-block",
            }}
          />
        </span>

        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {language && (
            <span
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                textTransform: "uppercase",
                fontWeight: "600",
              }}
            >
              {language}
            </span>
          )}
          <button
            onClick={handleCopy}
            style={{
              background: copied
                ? "rgba(34, 197, 94, 0.2)"
                : "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }
            }}
          >
            {copied ? "✓ 복사됨" : "복사"}
          </button>
        </span>
      </span>
    </span>
  );
};

export default CodeBlock;
