package com.vernora.api.common.web;

import java.util.Map;

/** Uniform error body for every non-2xx response (spec §19.3). */
public record ErrorResponse(
        String code,
        String message,
        String correlationId,
        Map<String, Object> details
) {
}
