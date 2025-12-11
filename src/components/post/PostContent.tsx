import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import CodeBlock, { CodeProps } from "@/components/codeBlock/CodeBlock";

interface PostContentProps {
  desc: string;
  isDark: boolean;
}

const PostContent = ({ desc, isDark }: PostContentProps) => {
  return (
    <div className="post-content-container">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks as any]}
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
                  className={className}
                  style={{
                    // 💡 isDark props를 사용하여 스타일 적용
                    background: isDark ? "#2d2d2d" : "silver",
                    color: isDark ? "#e2e8f0" : "#1a202c",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.9em",
                    fontWeight: "500",
                    fontFamily:
                      '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
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
