import ReactMarkdown, { type ExtraProps } from "react-markdown";
import type { ComponentPropsWithoutRef } from "react";
import type { Pluggable } from "unified";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import CodeBlock from "@/components/codeBlock/CodeBlock";
import "./markdown.css";

interface PostContentProps {
  desc: string;
  isDark: boolean;
}

type CodeProps = ComponentPropsWithoutRef<"code"> & ExtraProps & { inline?: boolean };

const PostContent = ({ desc, isDark }: PostContentProps) => {
  return (
    <div className="post-content-container">
      <ReactMarkdown
        // remark-breaks와 react-markdown이 사용하는 unified 버전의 타입 차이를 연결한다.
        remarkPlugins={[remarkGfm, remarkBreaks as unknown as Pluggable]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ inline, node, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeString = String(children).replace(/\n$/, "");
            const isInlineCode =
              inline === true ||
              (!className && !codeString.includes("\n") && codeString.length < 100);

            if (isInlineCode) {
              return (
                <code
                  style={{
                    background: isDark ? "#2a2a2a" : "#f0ede8",
                    color: isDark ? "#e2e8f0" : "#c7522a",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "0.88em",
                    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
                    border: `1px solid ${isDark ? "#444" : "#e0dbd4"}`,
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // 💡 CodeBlock에도 isDark props를 전달
            return (
              <CodeBlock language={language} isDark={isDark}>
                {codeString}
              </CodeBlock>
            );
          },
        }}
      >
        {desc}
      </ReactMarkdown>
    </div>
  );
};

export default PostContent;
