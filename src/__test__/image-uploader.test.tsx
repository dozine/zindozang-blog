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

let mockWidth = 1600;
let mockHeight = 1200;

beforeEach(() => {
  mockWidth = 1600;
  mockHeight = 1200;
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
      width: mockWidth,
      height: mockHeight,
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

test.each([
  ["diagram.svg", "image/svg+xml"],
  ["animation.gif", "image/gif"],
])("%s 원본을 변환 없이 업로드한다", async (name, type) => {
  const onUploaded = jest.fn();
  const file = new File(["original"], name, { type });
  render(<ImageUploader onImagesUploaded={onUploaded} />);
  fireEvent.change(screen.getByLabelText("사진 선택"), { target: { files: [file] } });
  await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
  expect(jest.mocked(uploadBytesResumable).mock.calls[0][1]).toBe(file);
  expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled();
});

test("작은 이미지는 확대하거나 재인코딩하지 않는다", async () => {
  mockWidth = 400;
  mockHeight = 300;
  const file = new File(["original"], "small.png", { type: "image/png" });
  const onUploaded = jest.fn();
  render(<ImageUploader onImagesUploaded={onUploaded} />);
  fireEvent.change(screen.getByLabelText("사진 선택"), { target: { files: [file] } });
  await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
  expect(jest.mocked(uploadBytesResumable).mock.calls[0][1]).toBe(file);
  expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled();
});

test.each([
  [2000, 1000, 800, 400],
  [1000, 2000, 300, 600],
])(
  "%s × %s 이미지를 비율을 유지해 축소한다",
  async (width, height, expectedWidth, expectedHeight) => {
    mockWidth = width;
    mockHeight = height;
    const onUploaded = jest.fn();
    render(<ImageUploader onImagesUploaded={onUploaded} />);
    fireEvent.change(screen.getByLabelText("사진 선택"), {
      target: { files: [new File(["photo"], "large.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    const ctx = jest.mocked(HTMLCanvasElement.prototype.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;
    expect(ctx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      expectedWidth,
      expectedHeight
    );
    expect(uploadBytesResumable).toHaveBeenCalledTimes(1);
  }
);
