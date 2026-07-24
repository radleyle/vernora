import { useQuery } from "@tanstack/react-query";
import { Course } from "@vernora/content-schema";
import { apiGet } from "../../lib/api";

type CourseDetailResponse = {
  id: string;
  language: string;
  version: number;
  content: unknown;
};

/**
 * Fetches a course and validates the document against the shared Zod schema
 * before any screen renders it. If the server ever serves a malformed
 * course, we fail here with a clear error instead of crashing mid-lesson.
 */
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const response = await apiGet<CourseDetailResponse>(
        `/v1/courses/${courseId}`,
      );
      return Course.parse(response.content);
    },
    staleTime: 5 * 60 * 1000,
  });
}
