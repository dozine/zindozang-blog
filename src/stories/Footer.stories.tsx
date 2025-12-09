import Footer from "@/components/footer/Footer";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Footer> = {
  title: "Components/Footer/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        style={{
          padding: "0 20px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  name: "기본 상태",
};

export const AtPageBottom: Story = {
  name: "페이지 하단에 고정",
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "0 20px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ padding: "20px 0" }}>페이지 컨텐츠 영역</p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const DarkMode: Story = {
  name: "다크 모드",
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{
          backgroundColor: "#1a1a1a",
          padding: "0 20px",
          maxWidth: "1280px",
          margin: "0 auto",
          minHeight: "100px",
        }}
      >
        <Story />
      </div>
    ),
  ],
};
