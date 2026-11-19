package com.project.resourcivo.controller;

import com.project.resourcivo.model.UserPhoto;
import com.project.resourcivo.security.CurrentUser;
import com.project.resourcivo.service.ProfilePhotoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Profile pictures. Any signed-in user can view a picture; only the owner can change or remove theirs.
 */
@RestController
@RequestMapping("/api/profile-photo")
@Tag(name = "Profile photo", description = "Profile pictures")
public class ProfilePhotoController {

    private final ProfilePhotoService service;
    private final CurrentUser currentUser;

    public ProfilePhotoController(ProfilePhotoService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload or replace my profile picture", description = "JPEG, PNG or WebP, up to 2 MB")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        UserPhoto saved = service.save(currentUser.require().getId(), file.getBytes());
        Map<String, Object> body = new HashMap<>();
        body.put("userId", saved.getUserId());
        body.put("contentType", saved.getContentType());
        body.put("size", saved.getData().length);
        body.put("updatedAt", saved.getUpdatedAt());
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/me")
    @Operation(summary = "Remove my profile picture")
    public ResponseEntity<Void> remove() {
        service.delete(currentUser.require().getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get a user's profile picture", description = "204 when the user has no picture")
    public ResponseEntity<byte[]> get(@PathVariable Long userId) {
        return service.find(userId)
                .map(p -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(p.getContentType()))
                        .cacheControl(CacheControl.noCache().cachePrivate())
                        .body(p.getData()))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
