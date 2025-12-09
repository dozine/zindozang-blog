import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState } from "react";
import Modal from "../components/modal/Modal";

const mockModalContent = (
  <div style={{ padding: "20px", fontSize: "1rem", color: "#1f2937" }}>
    <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "10px" }}>모달 내용</h2>
    <p>Storybook에서 props로 전달된 자식 요소입니다.</p>
    <p style={{ marginTop: "10px", color: "#6b7280" }}>
      배경을 클릭하거나 X 버튼을 눌러 모달을 닫아보세요.
    </p>
  </div>
);

const InteractiveModalWrapper = (args) => {
  const [isOpen, setIsOpen] = useState(args.initialOpen || false);
  const handleClose = () => {
    setIsOpen(false);
    args.onClose?.();
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <>
      <div
        style={{
          padding: "20px",
          minHeight: "100px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "1px dashed #ccc",
        }}
      >
        <button
          onClick={handleOpen}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "4px",
            backgroundColor: "#007AFF",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          모달 열기 ({isOpen ? "열림" : "닫힘"})
        </button>
      </div>
      <Modal {...args} isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

const meta: Meta<typeof Modal> = {
  title: "Components/Modal/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    children: mockModalContent,
    onClose: () => console.log("Modal closed triggered"),
  },
};

export default meta;

type Story = StoryObj<typeof Modal>;

export const DefaultOpen: Story = {
  name: "상호작용 가능한 모달",
  render: (args) => <InteractiveModalWrapper {...args} initialOpen={false} />,
  args: {
    isOpen: false,
  },
};

export const Closed: Story = {
  name: "닫힌 상태",
  args: {
    isOpen: false,
  },
  render: (args) => (
    <div style={{ padding: "20px", fontSize: "1rem", color: "#1f2937" }}>
      <p>모달이 닫힌 상태입니다. isOpen이 false로 설정되어 모달이 보이지 않습니다.</p>
      <Modal {...args} />
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};
