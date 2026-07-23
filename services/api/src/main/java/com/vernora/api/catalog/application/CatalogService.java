package com.vernora.api.catalog.application;

import com.vernora.api.catalog.api.dto.CourseResponse;
import com.vernora.api.catalog.api.dto.CourseSummaryResponse;
import com.vernora.api.catalog.infrastructure.CourseVersionReader;
import com.vernora.api.common.web.NotFoundException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class CatalogService {

    private final CourseVersionReader reader;
    private final ObjectMapper objectMapper;

    public CatalogService(CourseVersionReader reader, ObjectMapper objectMapper) {
        this.reader = reader;
        this.objectMapper = objectMapper;
    }

    public List<CourseSummaryResponse> listPublishedCourses() {
        return reader.findLatestPublishedSummaries().stream()
                .map(row -> new CourseSummaryResponse(
                        row.courseId(),
                        row.language(),
                        row.version(),
                        localizedTitle(row.titleEn(), row.titleVi())))
                .toList();
    }

    public CourseResponse getPublishedCourse(String courseId) {
        var row = reader.findLatestPublishedContent(courseId)
                .orElseThrow(() -> new NotFoundException(
                        "COURSE_NOT_FOUND",
                        "No published course with id \"%s\".".formatted(courseId)));
        return new CourseResponse(
                row.courseId(),
                row.language(),
                row.version(),
                objectMapper.readTree(row.contentJson()));
    }

    private static Map<String, String> localizedTitle(String en, String vi) {
        var title = new LinkedHashMap<String, String>();
        title.put("en", en);
        if (vi != null) {
            title.put("vi", vi);
        }
        return title;
    }
}
