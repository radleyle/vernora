import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../../lib/api";
import { useSession } from "../../providers/session-provider";

export type SavedPhrase = {
  phraseId: string;
  korean: string;
  meaningEn: string;
  romanization: string | null;
  sourceCourseId: string | null;
  sourceLessonId: string | null;
  createdAt: string;
};

type SavedPhrasesResponse = { phrases: SavedPhrase[] };

export type PhraseSubmission = {
  phraseId: string;
  korean: string;
  meaningEn: string;
  romanization?: string;
  sourceCourseId?: string;
  sourceLessonId?: string;
};

export function useSavedPhrases() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["saved-phrases", session?.user.id],
    enabled: Boolean(session),
    // 404/401 should fail immediately — default 3 retries felt like the
    // Save button and phrases screen were "lagging" and doing nothing.
    retry: false,
    queryFn: () =>
      apiGet<SavedPhrasesResponse>("/v1/saved-phrases", session!.access_token),
  });
}

export function useSavePhrase() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phrase: PhraseSubmission) => {
      if (!session) return;
      await apiPost(
        "/v1/saved-phrases",
        {
          phraseId: phrase.phraseId,
          korean: phrase.korean,
          meaningEn: phrase.meaningEn,
          romanization: phrase.romanization,
          sourceCourseId: phrase.sourceCourseId,
          sourceLessonId: phrase.sourceLessonId,
          clientCreatedAt: new Date().toISOString(),
        },
        session.access_token,
      );
    },
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-phrases"] });
    },
  });
}