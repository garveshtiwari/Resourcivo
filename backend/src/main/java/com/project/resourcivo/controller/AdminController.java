package com.project.resourcivo.controller;

import com.project.resourcivo.dto.EnabledRequest;
import com.project.resourcivo.dto.RoleUpdateRequest;
import com.project.resourcivo.dto.StaffCreateRequest;
import com.project.resourcivo.dto.StaffCreateResponse;
import com.project.resourcivo.dto.UserSummaryDTO;
import com.project.resourcivo.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin-only account management. Access is enforced in SecurityConfig (/api/admin/** = ADMIN).
 */
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Account and staff management (admin only)")
public class AdminController {

    private final StaffService staffService;

    public AdminController(StaffService staffService) {
        this.staffService = staffService;
    }

    @PostMapping("/staff")
    @Operation(summary = "Create staff account", description = "Creates a librarian or transport-manager login together with its staff record")
    public ResponseEntity<StaffCreateResponse> createStaff(@Valid @RequestBody StaffCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffService.createStaff(request));
    }

    @GetMapping("/users")
    @Operation(summary = "List user accounts")
    public ResponseEntity<List<UserSummaryDTO>> listUsers() {
        return ResponseEntity.ok(staffService.listUsers());
    }

    @PatchMapping("/users/{id}/enabled")
    @Operation(summary = "Enable or disable an account")
    public ResponseEntity<UserSummaryDTO> setEnabled(@PathVariable Long id, @Valid @RequestBody EnabledRequest request) {
        return ResponseEntity.ok(staffService.setEnabled(id, request.getEnabled()));
    }

    @PutMapping("/users/{id}/roles")
    @Operation(summary = "Replace an account's roles")
    public ResponseEntity<UserSummaryDTO> setRoles(@PathVariable Long id, @Valid @RequestBody RoleUpdateRequest request) {
        return ResponseEntity.ok(staffService.setRoles(id, request.getRoles()));
    }
}
