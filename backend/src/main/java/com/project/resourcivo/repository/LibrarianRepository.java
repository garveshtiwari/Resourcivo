package com.project.resourcivo.repository;

import com.project.resourcivo.model.Librarian;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LibrarianRepository extends JpaRepository<Librarian, Long> {
    java.util.Optional<Librarian> findByUserId(Long userId);

    boolean existsByLibraryId(Long libraryId);

    java.util.Optional<Librarian> findByLibraryId(Long libraryId);
}
