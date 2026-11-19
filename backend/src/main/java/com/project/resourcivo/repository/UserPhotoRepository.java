package com.project.resourcivo.repository;

import com.project.resourcivo.model.UserPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPhotoRepository extends JpaRepository<UserPhoto, Long> {
    Optional<UserPhoto> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
