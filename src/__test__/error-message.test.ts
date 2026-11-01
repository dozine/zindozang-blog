import { getErrorMessage } from "@/lib/utils/error";

test("오류 객체의 메시지를 사용한다", () => {
  expect(getErrorMessage(new Error("실패"), "기본 메시지")).toBe("실패");
  expect(getErrorMessage({ message: "외부 오류" }, "기본 메시지")).toBe("외부 오류");
});

test.each([null, undefined, "실패", {}, { message: 123 }, { message: "" }])(
  "사용 가능한 메시지가 없는 예외에는 기본 메시지를 사용한다: %p",
  (error) => {
    expect(getErrorMessage(error, "기본 메시지")).toBe("기본 메시지");
  }
);
