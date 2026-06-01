package com.unibus.api.student;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;

@RestController
@RequestMapping("/api/v1/universities")
public class UniversityController {

    private final UniversityCatalog universityCatalog;

    public UniversityController(UniversityCatalog universityCatalog) {
        this.universityCatalog = universityCatalog;
    }

    @GetMapping("/da-nang")
    ApiResponse<List<String>> listDaNangUniversities() {
        return ApiResponse.ok("Da Nang universities retrieved", universityCatalog.list());
    }
}
