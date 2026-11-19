package com.project.resourcivo.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import java.util.List;
import com.project.resourcivo.dto.StudentCreateDTO;
import com.project.resourcivo.dto.StudentUpdateDTO;
import com.project.resourcivo.dto.StudentResponseDTO;
import com.project.resourcivo.criteria.StudentFilterDTO;
import com.project.resourcivo.service.IStudentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;

@RestController
@RequestMapping("/api/student")
@Tag(name = "Student Management", description = "APIs for managing students")
public class StudentController {

    private final IStudentService service;
    private final com.project.resourcivo.service.BookIssueService issueService;
    private final com.project.resourcivo.security.CurrentUser currentUser;

    public StudentController(IStudentService service, com.project.resourcivo.service.BookIssueService issueService,
            com.project.resourcivo.security.CurrentUser currentUser) {
        this.service = service;
        this.issueService = issueService;
        this.currentUser = currentUser;
    }

    // ---------------------------------------------------------------- "my profile" (STUDENT role)

    @GetMapping("/me")
    public ResponseEntity<?> getMine() {
        StudentResponseDTO mine = service.getMine(currentUser.require());
        return mine == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(mine);
    }

    @PostMapping("/me")
    public ResponseEntity<StudentResponseDTO> createMine(@Valid @RequestBody StudentCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createMine(currentUser.require(), dto));
    }

    @PatchMapping("/me")
    public ResponseEntity<StudentResponseDTO> updateMine(@Valid @RequestBody StudentUpdateDTO dto) {
        return ResponseEntity.ok(service.updateMine(currentUser.require(), dto));
    }

    @GetMapping("/me/emergency-contacts")
    public ResponseEntity<?> myEmergencyContacts() {
        return ResponseEntity.ok(service.listEmergencyContacts(myStudentId()));
    }

    @PostMapping("/me/emergency-contact")
    public ResponseEntity<?> addMyEmergencyContact(
            @Valid @RequestBody com.project.resourcivo.dto.EmergencyContactCreateDTO dto) {
        return ResponseEntity.ok(service.addEmergencyContact(myStudentId(), dto));
    }

    @DeleteMapping("/me/emergency-contacts/{contactId}")
    public ResponseEntity<?> removeMyEmergencyContact(@PathVariable Long contactId) {
        service.removeEmergencyContact(myStudentId(), contactId);
        return ResponseEntity.noContent().build();
    }

    private Long myStudentId() {
        Long id = service.idOfMine(currentUser.require());
        if (id == null) {
            throw new com.project.resourcivo.exception.ResourceNotFoundException(
                    "Student profile not found. Create it first.");
        }
        return id;
    }

    // ---------------------------------------------------------------- by id

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        StudentResponseDTO res = service.getById(id);
        if (res == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{id}/emergency-contacts")
    public ResponseEntity<?> listEmergencyContacts(@PathVariable Long id) {
        return ResponseEntity.ok(service.listEmergencyContacts(id));
    }

    @DeleteMapping("/{id}/emergency-contacts/{contactId}")
    public ResponseEntity<?> removeEmergencyContact(@PathVariable Long id, @PathVariable Long contactId) {
        service.removeEmergencyContact(id, contactId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/issue-request/{id}/cancel")
    public ResponseEntity<?> cancelIssueRequest(@PathVariable Long id) {
        issueService.cancelRequest(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/issue-request/{id}/renew")
    public ResponseEntity<?> renewIssue(@PathVariable Long id) {
        return ResponseEntity.ok(issueService.renew(id));
    }

    @PostMapping
    @Operation(summary = "Create new student", description = "Creates a new student with the provided details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Student created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    public ResponseEntity<StudentResponseDTO> create(@Valid @RequestBody StudentCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createFromDto(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update student", description = "Updates all fields of an existing student")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Student updated successfully"),
            @ApiResponse(responseCode = "404", description = "Student not found")
    })
    public ResponseEntity<?> update(
            @Parameter(description = "Student ID") @PathVariable Long id,
            @Valid @RequestBody StudentCreateDTO dto) {
        var res = service.updateFromDto(id, dto);
        if (res == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found");
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Partial update student", description = "Updates specific fields of an existing student")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Student updated successfully"),
            @ApiResponse(responseCode = "404", description = "Student not found")
    })
    public ResponseEntity<?> patch(
            @Parameter(description = "Student ID") @PathVariable Long id,
            @Valid @RequestBody StudentUpdateDTO dto) {
        var res = service.partialUpdateFromDto(id, dto);
        if (res == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/search")
    @Operation(summary = "Search students", description = "Search students using filter criteria")
    @ApiResponse(responseCode = "200", description = "Search results returned successfully")
    public ResponseEntity<List<StudentResponseDTO>> search(@RequestBody StudentFilterDTO filter) {
        return ResponseEntity.ok(service.search(filter));
    }

    @PostMapping("/issue-request")
    @Operation(summary = "Request book issue", description = "Student requests a book to be issued")
    public ResponseEntity<?> requestIssue(@Valid @RequestBody com.project.resourcivo.dto.BookIssueRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(issueService.requestIssue(dto));
    }

    @GetMapping("/{id}/issued-books")
    @Operation(summary = "Get issued books", description = "Get list of books issued to the student (including pending return)")
    public ResponseEntity<?> getIssuedBooks(@PathVariable Long id) {
        return ResponseEntity.ok(issueService.getEffectiveIssuedBooks(id));
    }

    @GetMapping("/{id}/issue-history")
    @Operation(summary = "Get issue history", description = "Get complete history of books issued to the student")
    public ResponseEntity<?> getIssueHistory(@PathVariable Long id) {
        return ResponseEntity.ok(issueService.getIssueHistory(id));
    }

    @PutMapping("/issue-request/{id}/return")
    @Operation(summary = "Request book return", description = "Student requests to return an issued book")
    public ResponseEntity<?> requestReturn(@PathVariable Long id) {
        return ResponseEntity.ok(issueService.requestReturn(id));
    }

    @PostMapping("/{id}/emergency-contact")
    @Operation(summary = "Add emergency contact", description = "Add an emergency contact for the student (Max 2)")
    public ResponseEntity<?> addEmergencyContact(@PathVariable Long id,
            @Valid @RequestBody com.project.resourcivo.dto.EmergencyContactCreateDTO dto) {
        return ResponseEntity.ok(service.addEmergencyContact(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete student", description = "Deletes a student by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Student deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Student not found")
    })
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "Get all students", description = "Retrieves a list of all students")
    @ApiResponse(responseCode = "200", description = "List of students retrieved successfully")
    public ResponseEntity<List<StudentResponseDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }
}
