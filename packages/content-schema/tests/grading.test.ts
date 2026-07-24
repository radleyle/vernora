import { describe, expect, it } from "vitest";
import {
  isAcceptedAnswer,
  isCorrectTokenOrder,
  normalizeAnswer,
} from "../src/grading";

describe("normalizeAnswer", () => {
  it("ignores punctuation and extra whitespace", () => {
    expect(normalizeAnswer("  감사합니다!  ")).toBe("감사합니다");
    expect(normalizeAnswer("안녕하세요,   저는  민수예요.")).toBe(
      "안녕하세요 저는 민수예요",
    );
  });

  it("treats composed and decomposed Hangul as equal", () => {
    const composed = "감사합니다";
    const decomposed = composed.normalize("NFD");
    expect(composed).not.toBe(decomposed); // different code points...
    expect(normalizeAnswer(decomposed)).toBe(normalizeAnswer(composed)); // ...same answer
  });
});

describe("isAcceptedAnswer", () => {
  it("accepts any listed alternative", () => {
    const accepted = ["감사합니다", "고마워요"];
    expect(isAcceptedAnswer("고마워요!", accepted)).toBe(true);
    expect(isAcceptedAnswer(" 감사합니다 ", accepted)).toBe(true);
    expect(isAcceptedAnswer("안녕하세요", accepted)).toBe(false);
  });
});

describe("isCorrectTokenOrder", () => {
  const correct = ["안녕하세요", "저는", "민수예요"];

  it("accepts the exact order", () => {
    expect(isCorrectTokenOrder(["안녕하세요", "저는", "민수예요"], correct)).toBe(true);
  });

  it("rejects wrong order and missing tokens", () => {
    expect(isCorrectTokenOrder(["저는", "안녕하세요", "민수예요"], correct)).toBe(false);
    expect(isCorrectTokenOrder(["안녕하세요", "저는"], correct)).toBe(false);
  });
});
