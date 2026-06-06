"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";

export interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

export interface CodeBlockProps {
  language?: string;
  children: string;
  isDark?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language = "", children, isDark = false }) => {
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

  const headerBg = isDark ? "#1a1a2e" : "#f0ede8";
  const headerBorder = isDark ? "#2d2d2d" : "#e0dbd4";
  const codeBg = isDark ? "#1e1e1e" : "#faf8f5";

  return (
    <span
      style={{
        display: "block",
        position: "relative",
        margin: "28px 0",
        width: "100%",
        border: `1px solid ${headerBorder}`,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* 헤더 바 */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          height: "38px",
          background: headerBg,
          borderBottom: `1px solid ${headerBorder}`,
        }}
      >
        {/* 맥 버튼 */}
        <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#ff5f56",
            }}
          />
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#ffbd2e",
            }}
          />
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#27ca3f",
            }}
          />
        </span>

        {/* 오른쪽: 언어 + 복사 버튼 */}
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {language && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "600",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isDark ? "#888" : "#999",
                fontFamily: "monospace",
              }}
            >
              {language}
            </span>
          )}
          <button
            onClick={handleCopy}
            style={{
              background: "transparent",
              border: `1px solid ${isDark ? "#444" : "#ddd"}`,
              color: isDark ? "#888" : "#999",
              padding: "3px 10px",
              borderRadius: "3px",
              fontSize: "10px",
              cursor: "pointer",
              letterSpacing: "0.05em",
              transition: "all 0.2s ease",
              fontFamily: "monospace",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isDark ? "#fff" : "#333";
              e.currentTarget.style.borderColor = isDark ? "#888" : "#888";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isDark ? "#888" : "#999";
              e.currentTarget.style.borderColor = isDark ? "#444" : "#ddd";
            }}
          >
            {copied ? "✓ copied" : "copy"}
          </button>
        </span>
      </span>

      {/* 코드 영역 */}
      <SyntaxHighlighter
        style={isDark ? vscDarkPlus : oneLight}
        language={language || "text"}
        PreTag="pre"
        showLineNumbers={true}
        wrapLines={false}
        customStyle={{
          display: "block",
          width: "100%",
          overflowX: "auto",
          borderRadius: "0",
          fontSize: "13px",
          lineHeight: "1.7",
          padding: "20px",
          margin: 0,
          background: codeBg,
        }}
        codeTagProps={{
          style: {
            fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
            whiteSpace: "pre",
            wordBreak: "normal",
          },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </span>
  );
};

export default CodeBlock;
