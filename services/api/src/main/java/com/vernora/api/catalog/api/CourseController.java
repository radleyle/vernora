package com.vernora.api.catalog.api;

import com.vernora.api.catalog.api.dto.CourseResponse;
import com.vernora.api.catalog.api.dto.CourseSummaryResponse;
import com.vernora.api.catalog.application.CatalogService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/courses")
public class CourseController {

    private final CatalogService catalogService;

    public CourseController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public List<CourseSummaryResponse> listCourses() {
        return catalogService.listPublishedCourses();
    }

    @GetMapping("/{courseId}")
    public CourseResponse getCourse(@PathVariable String courseId) {
        return catalogService.getPublishedCourse(courseId);
    }
}
