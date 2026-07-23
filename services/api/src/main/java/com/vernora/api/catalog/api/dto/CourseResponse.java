package com.vernora.api.catalog.api.dto;

import tools.jackson.databind.JsonNode;

/** The full published course document plus its version metadata. */
public record CourseResponse(
        String id,
        String language,
        int version,
        JsonNode content
) {
}
