package com.project.resourcivo.controller;

import com.project.resourcivo.dto.SubjectRefDTO;
import com.project.resourcivo.repository.SubjectRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Read-only data that sign-up and profile forms need (open to everyone, see /api/public/** in SecurityConfig).
 */
@RestController
@RequestMapping("/api/public")
@Tag(name = "Public", description = "Open reference data")
public class PublicController {

    private final SubjectRepository subjectRepository;

    public PublicController(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @GetMapping("/subjects")
    @Operation(summary = "List subjects", description = "Subject names for dropdowns (a form adds its own 'Other' option)")
    public ResponseEntity<List<SubjectRefDTO>> subjects() {
        List<SubjectRefDTO> subjects = subjectRepository.findAll().stream()
                .filter(s -> s.getName() != null && !s.getName().isBlank())
                .map(s -> {
                    SubjectRefDTO dto = new SubjectRefDTO();
                    dto.setId(s.getId());
                    dto.setName(s.getName());
                    return dto;
                })
                .sorted(Comparator.comparing(SubjectRefDTO::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
        return ResponseEntity.ok(subjects);
    }
}
