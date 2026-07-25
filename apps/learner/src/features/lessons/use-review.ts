import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../lib/api";
import { useSession } from "../../providers/session-provider";

/** Mirrors the API's ReviewQueueResponse. */
export type ReviewQueue = {
  generatedAt: string;
  items: ReviewQueueItem[];
};

export type ReviewQueueItem = {
  exerciseId: string;
  courseId: string;
  lessonId: string;
  streak: number;
  dueAt: string;
};

export function useReviewQueue() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["review-queue", session?.user.id],
    enabled: Boolean(session),
    queryFn: () =>
      apiGet<ReviewQueue>("/v1/reviews/due", session!.access_token),
  });
}
