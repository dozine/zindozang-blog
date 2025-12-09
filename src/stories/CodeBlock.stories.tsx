import CodeBlock from "@/components/codeBlock/CodeBlock";
import type { Meta, StoryObj } from "@storybook/react";
const meta: Meta<typeof CodeBlock> = {
  title: "Components/CodeBlock/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs"],
  argTypes: {
    language: {
      control: "text",
      description:
        "하이라이팅할 코드 언어 (예: javascript, typescript, python)",
      defaultValue: "javascript",
    },
    children: {
      control: "text",
      description: "코드 블록에 표시될 내용",
    },
    isDark: {
      control: "boolean",
      description: "다크 모드 스타일 적용 여부",
      defaultValue: false,
    },
  },
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#24292e" },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const JavascriptLight: Story = {
  name: "자바스크립트 코드 블록 (라이트 모드)",
  args: {
    language: "javascript",
    isDark: false,
    children: `function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("Storybook");`,
  },
};

export const PythonDark: Story = {
  name: "파이썬 코드 블록 (다크 모드)",
  args: {
    language: "python",
    isDark: true,
    children: `class MyClass:
  def __init__(self, value):
    self.value = value

  def get_value(self):
    return self.value

instance = MyClass(42)
print(instance.get_value())`,
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export const Typescript: Story = {
  name: "타입스크립트 코드 블록",
  args: {
    language: "typescript",
    isDark: false,
    children: `interface User {
  id: number;
  name: string;
}

const user: User = {
  id: 1,
  name: "Alice",
};

function displayUser(u: User): void {
  console.log(\`User ID: \${u.id}, Name: \${u.name}\`);
}`,
  },
};

export const PlainText: Story = {
  name: "언어 미지정 코드 블록 (일반 텍스트)",
  args: {
    language: "",
    isDark: false,
    children: `이것은 언어가 지정되지 않은 일반 텍스트입니다.
하이라이팅이 적용되지 않습니다.
줄바꿈이 그대로 표시됩니다.`,
  },
};

export const LongLineTest: Story = {
  name: "긴 줄 테스트 (가로 스크롤 확인용)",
  args: {
    language: "bash",
    isDark: true,
    children: `echo "This is a very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very long line that should trigger horizontal scrolling in the code block."`,
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};
