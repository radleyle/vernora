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
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course", courseId],
    // Hooks must be called unconditionally, so callers that don't know the
    // course yet (e.g. the review screen before its queue loads) pass
    // undefined and the fetch simply waits.
    enabled: Boolean(courseId),
    queryFn: async () => {
      const response = await apiGet<CourseDetailResponse>(
        `/v1/courses/${courseId}`,
      );
      return Course.parse(response.content);
    },
    staleTime: 5 * 60 * 1000,
  });
}
