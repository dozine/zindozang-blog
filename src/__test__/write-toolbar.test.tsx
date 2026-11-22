import { codeBlockCommand } from "@/components/writeEditor/toolbar";
import type { TextAreaTextApi } from "@uiw/react-md-editor/commands";

function execute(text: string, start: number, end: number, language: string) {
  let result = text;
  const replaceSelection = jest.fn((replacement: string) => {
    result = text.slice(0, start) + replacement + text.slice(end);
  });
  const setSelectionRange = jest.fn();
  const command = codeBlockCommand(language, language || "일반 텍스트");
  command.execute?.(
    { text, selectedText: text.slice(start, end), selection: { start, end }, command },
    { replaceSelection, setSelectionRange } as unknown as TextAreaTextApi
  );
  return { result, setSelectionRange };
}

test("선택한 코드를 언어가 지정된 블록으로 감싸고 코드 영역을 선택한다", () => {
  const text = "앞 문단const x = 1;뒤 문단";
  const { result, setSelectionRange } = execute(text, 4, 16, "typescript");
  expect(result).toBe("앞 문단\n\n```typescript\nconst x = 1;\n```\n\n뒤 문단");
  const start = result.indexOf("const");
  expect(setSelectionRange).toHaveBeenCalledWith({ start, end: start + 12 });
});

test("빈 본문에 코드 입력 틀을 삽입한다", () => {
  const { result } = execute("", 0, 0, "tsx");
  expect(result).toBe("```tsx\n코드를 입력하세요\n```");
});

test("선택 내용에 백틱이 포함되어도 코드 블록이 끊어지지 않는다", () => {
  const text = "```json\n{}\n```";
  expect(execute(text, 0, text.length, "markdown").result).toBe("````markdown\n" + text + "\n````");
});

test("기존 문단 사이의 빈 줄을 중복 추가하지 않는다", () => {
  expect(execute("앞\n\n뒤", 3, 3, "").result).toBe("앞\n\n```\n코드를 입력하세요\n```\n\n뒤");
});
