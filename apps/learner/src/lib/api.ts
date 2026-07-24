const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

/** Shapes returned by the Spring API (see CourseController DTOs). */
export type CourseSummary = {
  id: string;
  language: string;
  version: number;
  title: Record<string, string>;
};

export type Me = {
  userId: string;
  email: string | null;
};

export async function apiGet<T>(path: string, accessToken?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} on ${path}`);
  }
  return response.json() as Promise<T>;
}
