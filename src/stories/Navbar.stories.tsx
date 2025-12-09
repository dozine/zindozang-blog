import Navbar from "@/components/navbar/Navbar";
import type { Meta, StoryObj } from "@storybook/react";
import { SessionProvider } from "next-auth/react";

const meta: Meta<typeof Navbar> = {
  title: "Components/Navbar/Navbar",
  component: Navbar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ minHeight: "100px", padding: "0 5vw" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Unauthenticated: Story = {
  name: "비인증 상태",
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          expires: null,
          user: null,
        }}
      >
        <Story />
      </SessionProvider>
    ),
  ],
  parameters: {
    nextAuthMock: {
      session: null,
      status: "unauthenticated",
    },
  },
};

export const Authenticated: Story = {
  name: "인증 상태",
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          user: {
            name: "진도장",
            email: "test@example.com",
            image: "https://placehold.co/40x40/007AFF/FFFFFF?text=U",
          },
        }}
      >
        <Story />
      </SessionProvider>
    ),
  ],
  parameters: {
    nextAuthMock: {
      session: {
        user: {
          name: "진도장",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    },
  },
};

export const Loading: Story = {
  name: "로딩 상태",
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
  parameters: {
    nextAuthMock: {
      session: null,
      status: "loading",
    },
  },
};

export const AuthenticatedDarkMode: Story = {
  name: "인증 상태 - 다크 모드",
  ...Authenticated,
  parameters: {
    ...Authenticated.parameters,
    backgrounds: {
      default: "dark",
    },
    theme: "dark",
  },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{
          backgroundColor: "#1a1a1a",
          minHeight: "100px",
          color: "#fff",
        }}
      >
        <SessionProvider
          session={{
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            user: {
              name: "진도장",
              email: "test@example.com",
              image: "https://placehold.co/40x40/007AFF/FFFFFF?text=U",
            },
          }}
        >
          <Story />
        </SessionProvider>
      </div>
    ),
  ],
};
