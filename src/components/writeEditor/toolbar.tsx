import * as commands from "@uiw/react-md-editor/commands";
import type { ICommand } from "@uiw/react-md-editor";

function labeled(command: ICommand, label: string): ICommand {
  return { ...command, buttonProps: { ...command.buttonProps, "aria-label": label, title: label } };
}

const languages = [
  ["", "일반 텍스트"],
  ["typescript", "TypeScript"],
  ["tsx", "TSX"],
  ["javascript", "JavaScript"],
  ["jsx", "JSX"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["json", "JSON"],
  ["bash", "Bash"],
  ["sql", "SQL"],
  ["python", "Python"],
];

export function codeBlockCommand(language: string, label: string): ICommand {
  return {
    name: `code-block-${language || "text"}`,
    keyCommand: `code-block-${language || "text"}`,
    icon: <span>{label}</span>,
    buttonProps: { "aria-label": `${label} 코드 블록`, title: `${label} 코드 블록` },
    execute: (state, api) => {
      const content = state.selectedText || "코드를 입력하세요";
      // 선택한 코드 안에 백틱이 있어도 블록이 도중에 닫히지 않게 한다.
      const runs = content.match(/`+/g) ?? [];
      const fence = "`".repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
      const before = state.text.slice(0, state.selection.start);
      const after = state.text.slice(state.selection.end);
      const prefix = `${before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : ""}${fence}${language}\n`;
      const suffix = `\n${fence}${after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : ""}`;
      api.replaceSelection(prefix + content + suffix);
      const start = state.selection.start + prefix.length;
      api.setSelectionRange({ start, end: start + content.length });
    },
  };
}

export const formattingCommands: ICommand[] = [
  commands.group(
    [
      labeled(commands.title1, "제목 1"),
      labeled(commands.title2, "제목 2"),
      labeled(commands.title3, "제목 3"),
    ],
    { name: "headings", icon: <span>H</span>, buttonProps: { "aria-label": "제목", title: "제목" } }
  ),
  labeled(commands.bold, "굵게"),
  labeled(commands.italic, "기울임"),
  labeled(commands.strikethrough, "취소선"),
  commands.divider,
  labeled(commands.link, "링크"),
  labeled(commands.quote, "인용"),
  labeled(commands.table, "표 삽입"),
  labeled(commands.hr, "가로 구분선"),
  labeled(commands.unorderedListCommand, "글머리 목록"),
  labeled(commands.orderedListCommand, "번호 목록"),
  labeled(commands.checkedListCommand, "체크 목록"),
  commands.divider,
  labeled(commands.code, "인라인 코드"),
  commands.group(
    languages.map(([language, label]) => codeBlockCommand(language, label)),
    {
      name: "code-languages",
      icon: <span>{"{ }"}</span>,
      buttonProps: { "aria-label": "코드 블록 언어 선택", title: "코드 블록 언어 선택" },
    }
  ),
  commands.divider,
];
