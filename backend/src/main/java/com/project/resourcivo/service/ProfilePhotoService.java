package com.project.resourcivo.service;

import com.project.resourcivo.model.UserPhoto;
import com.project.resourcivo.repository.UserPhotoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ProfilePhotoService {

    public static final int MAX_BYTES = 2 * 1024 * 1024;

    private final UserPhotoRepository repository;

    public ProfilePhotoService(UserPhotoRepository repository) {
        this.repository = repository;
    }

    /**
     * Save (or replace) a user's picture. The type is detected from the file's own bytes,
     * so a renamed file or a made-up Content-Type is not trusted.
     */
    @Transactional
    public UserPhoto save(Long userId, byte[] data) {
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("No image was uploaded");
        }
        if (data.length > MAX_BYTES) {
            throw new IllegalArgumentException("Image is too large (maximum 2 MB)");
        }
        String type = detectType(data);
        if (type == null) {
            throw new IllegalArgumentException("Only JPEG, PNG or WebP images are allowed");
        }
        UserPhoto photo = repository.findByUserId(userId).orElseGet(UserPhoto::new);
        photo.setUserId(userId);
        photo.setContentType(type);
        photo.setData(data);
        photo.setUpdatedAt(LocalDateTime.now());
        return repository.save(photo);
    }

    public Optional<UserPhoto> find(Long userId) {
        return repository.findByUserId(userId);
    }

    @Transactional
    public void delete(Long userId) {
        repository.deleteByUserId(userId);
    }

    static String detectType(byte[] d) {
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G'
                && d[4] == 0x0D && d[5] == 0x0A && d[6] == 0x1A && d[7] == 0x0A) {
            return "image/png";
        }
        if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return "image/webp";
        }
        return null;
    }
}
