package com.vernora.api.catalog.api.dto;

import java.util.Map;

public record CourseSummaryResponse(
        String id,
        String language,
        int version,
        Map<String, String> title
) {
}
