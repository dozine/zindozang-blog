import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { uploadBytesResumable } from "firebase/storage";
import ImageUploader from "@/components/imageUploader/ImageUploader";

jest.mock(
  "next/image",
  () =>
    function MockImage() {
      return null;
    }
);
jest.mock("@/lib/external/firebase", () => ({ app: {} }));
jest.mock("firebase/storage", () => ({
  getStorage: () => ({}),
  ref: (_storage: unknown, path: string) => path,
  getDownloadURL: async (path: string) => `https://storage/${path}`,
  uploadBytesResumable: jest.fn((path: string) => ({
    snapshot: { ref: path },
    on: (_event: string, progress: (value: unknown) => void, _error: unknown, done: () => void) => {
      progress({ bytesTransferred: 1, totalBytes: 1 });
      done();
    },
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn(() => "blob:photo"),
  });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() });
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: jest.fn(() => "upload-id"),
  });
  jest.spyOn(window, "Image").mockImplementation(() => {
    const img = {
      width: 100,
      height: 100,
      onload: () => {},
      set src(_value: string) {
        this.onload();
      },
    };
    return img as unknown as HTMLImageElement;
  });
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({ drawImage: jest.fn() } as unknown as CanvasRenderingContext2D);
  jest
    .spyOn(HTMLCanvasElement.prototype, "toBlob")
    .mockImplementation((callback) => callback(new Blob(["image"], { type: "image/png" })));
});
afterEach(() => jest.restoreAllMocks());

test("여러 사진 중 잘못된 파일은 건너뛰고 성공한 사진 순서를 유지한다", async () => {
  const onUploaded = jest.fn();
  render(<ImageUploader onImagesUploaded={onUploaded} />);
  const input = screen.getByLabelText("사진 선택");
  expect(input.hasAttribute("multiple")).toBe(true);
  fireEvent.change(input, {
    target: {
      files: [
        new File(["a"], "first.png", { type: "image/png" }),
        new File(["bad"], "invalid.txt", { type: "text/plain" }),
        new File(["b"], "second.png", { type: "image/png" }),
      ],
    },
  });
  await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
  expect(onUploaded.mock.calls[0][0]).toEqual([
    "https://storage/images/upload-id_medium_first.png",
    "https://storage/images/upload-id_medium_second.png",
  ]);
  expect(uploadBytesResumable).toHaveBeenCalledTimes(2);
  expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("alert").textContent).toContain("invalid.txt");
  expect((input as HTMLInputElement).disabled).toBe(false);
});

test("전부 실패하면 본문 삽입을 요청하지 않는다", async () => {
  const onUploaded = jest.fn();
  render(<ImageUploader onImagesUploaded={onUploaded} />);
  fireEvent.change(screen.getByLabelText("사진 선택"), {
    target: { files: [new File(["bad"], "bad.txt", { type: "text/plain" })] },
  });
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("bad.txt"));
  expect(onUploaded).not.toHaveBeenCalled();
});

test("SVG를 PNG로 변환해 업로드한다", async () => {
  const onUploaded = jest.fn();
  render(<ImageUploader onImagesUploaded={onUploaded} />);
  fireEvent.change(screen.getByLabelText("사진 선택"), {
    target: {
      files: [
        new File(
          ['<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>'],
          "diagram.svg",
          { type: "image/svg+xml" }
        ),
      ],
    },
  });
  await waitFor(() =>
    expect(onUploaded).toHaveBeenCalledWith(["https://storage/images/upload-id_medium_diagram.png"])
  );
  expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
    expect.any(Function),
    "image/png",
    0.8
  );
  expect(uploadBytesResumable).toHaveBeenCalledTimes(1);
  expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alert")).toBeNull();
});
