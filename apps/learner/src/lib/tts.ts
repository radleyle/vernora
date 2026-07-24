import * as Speech from "expo-speech";

/**
 * Speaks Korean text with the device/browser voice (Web Speech API on web).
 * Free, offline-capable, and good enough for the MVP — native-speaker
 * recordings can replace specific audio later (spec §20.1).
 */
export function speakKorean(text: string): void {
  Speech.stop();
  Speech.speak(text, { language: "ko-KR", rate: 0.9 });
}
