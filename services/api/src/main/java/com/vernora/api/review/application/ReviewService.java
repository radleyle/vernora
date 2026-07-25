package com.vernora.api.review.application;

import com.vernora.api.review.api.dto.ReviewQueueResponse;
import com.vernora.api.review.api.dto.ReviewQueueResponse.ReviewItem;
import com.vernora.api.review.domain.ReviewScheduler;
import com.vernora.api.review.infrastructure.AttemptStreamReader;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Thin orchestration: read the stream, run the pure scheduler, shape the
 * response. Re-deriving the schedule per request is deliberate at this stage
 * — it can never disagree with the attempt history. When attempt counts grow,
 * the spec's review_items table becomes a cache of this computation, not a
 * second source of truth.
 */
@Service
public class ReviewService {

    private final AttemptStreamReader attemptStream;
    private final Clock clock;

    public ReviewService(AttemptStreamReader attemptStream, Clock clock) {
        this.attemptStream = attemptStream;
        this.clock = clock;
    }

    public ReviewQueueResponse getDueReviews(UUID userId) {
        var now = clock.instant();
        var scheduled = ReviewScheduler.schedule(attemptStream.readHistory(userId));
        var items =
                ReviewScheduler.due(scheduled, now).stream()
                        .map(item ->
                                new ReviewItem(
                                        item.exerciseId(),
                                        item.courseId(),
                                        item.lessonId(),
                                        item.streak(),
                                        item.dueAt()))
                        .toList();
        return new ReviewQueueResponse(now, items);
    }
}
