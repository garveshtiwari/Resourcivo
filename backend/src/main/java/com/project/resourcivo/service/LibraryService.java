package com.project.resourcivo.service;

import com.project.resourcivo.dto.LibraryCreateDTO;
import com.project.resourcivo.dto.LibraryResponseDTO;
import com.project.resourcivo.dto.LibraryUpdateDTO;
import com.project.resourcivo.mapper.LibraryMapper;
import com.project.resourcivo.model.Library;
import com.project.resourcivo.model.Librarian;
import com.project.resourcivo.repository.LibraryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LibraryService implements ILibraryService {

    private final LibraryRepository repo;
    private final com.project.resourcivo.repository.LibraryBookRepository bookRepo;
    private final com.project.resourcivo.repository.LibrarianRepository librarianRepo;
    private final NotificationService notifications;

    public LibraryService(LibraryRepository repo, com.project.resourcivo.repository.LibraryBookRepository bookRepo,
            com.project.resourcivo.repository.LibrarianRepository librarianRepo, NotificationService notifications) {
        this.notifications = notifications;
        this.repo = repo;
        this.bookRepo = bookRepo;
        this.librarianRepo = librarianRepo;
    }

    @Override
    @Transactional
    public LibraryResponseDTO createFromDto(LibraryCreateDTO dto) {
        requireText(dto.getName(), "Library name is required");
        requireText(dto.getLocation(), "Location is required");
        Library e = LibraryMapper.toEntity(dto);
        e.setName(e.getName().trim());
        e.setLocation(e.getLocation().trim());
        Library saved = repo.save(e);
        if (dto.getLibrarianId() != null) {
            assignLibrarian(saved, dto.getLibrarianId());
        }
        return LibraryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public LibraryResponseDTO updateFromDto(Long id, LibraryUpdateDTO dto) {
        if (dto.getName() != null)
            requireText(dto.getName(), "Library name cannot be blank");
        if (dto.getLocation() != null)
            requireText(dto.getLocation(), "Location cannot be blank");
        return repo.findById(id).map(existing -> {
            LibraryMapper.mergeUpdate(dto, existing);
            if (existing.getName() != null)
                existing.setName(existing.getName().trim());
            if (existing.getLocation() != null)
                existing.setLocation(existing.getLocation().trim());
            Library saved = repo.save(existing);
            if (Boolean.TRUE.equals(dto.getClearLibrarian()) && saved.getLibrarian() != null) {
                Librarian previous = saved.getLibrarian();
                previous.setLibrary(null);
                librarianRepo.save(previous);
                saved.setLibrarian(null);
                notifications.notify(previous.getUserId(), NotificationService.LIBRARY, NotificationService.INFO,
                        "Library assignment removed",
                        "You are no longer in charge of " + saved.getName() + ".", "/library");
            }
            if (dto.getLibrarianId() != null) {
                assignLibrarian(saved, dto.getLibrarianId());
            }
            return LibraryMapper.toResponse(saved);
        }).orElse(null);
    }

    @Override
    public LibraryResponseDTO getById(Long id) {
        return repo.findById(id).map(LibraryMapper::toResponse).orElse(null);
    }

    @Override
    public List<LibraryResponseDTO> getAll() {
        return repo.findAll().stream().map(LibraryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean delete(Long id) {
        if (!repo.existsById(id)) {
            return false;
        }
        if (bookRepo.existsByLibraryId(id)) {
            throw new IllegalStateException("This library still has books. Move or delete them first.");
        }
        if (librarianRepo.existsByLibraryId(id)) {
            throw new IllegalStateException("A librarian is assigned to this library. Reassign them first.");
        }
        repo.deleteById(id);
        return true;
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * A librarian manages at most one library and a library has one librarian, so choosing a librarian
     * releases whoever managed this library before and moves the librarian away from their old library.
     */
    private void assignLibrarian(Library library, Long librarianId) {
        Librarian chosen = librarianRepo.findById(librarianId)
                .orElseThrow(() -> new IllegalArgumentException("Selected librarian was not found"));
        if (library.getLibrarian() != null && !library.getLibrarian().getId().equals(chosen.getId())) {
            Librarian previous = library.getLibrarian();
            previous.setLibrary(null);
            librarianRepo.saveAndFlush(previous); // free the one-to-one slot before it is reused
            notifications.notify(previous.getUserId(), NotificationService.LIBRARY, NotificationService.INFO,
                    "Library assignment removed", "You are no longer in charge of " + library.getName() + ".",
                    "/library");
        }
        boolean alreadyMine = library.getLibrarian() != null && library.getLibrarian().getId().equals(chosen.getId());
        chosen.setLibrary(library);
        librarianRepo.save(chosen);
        library.setLibrarian(chosen);
        if (!alreadyMine) {
            notifications.notify(chosen.getUserId(), NotificationService.LIBRARY, NotificationService.INFO,
                    "New library assignment", "You are now in charge of " + library.getName() + ".", "/library");
        }
    }

    @Override
    public List<com.project.resourcivo.dto.LibrarianOptionDTO> getLibrarianOptions() {
        return librarianRepo.findAll().stream().map(l -> {
            com.project.resourcivo.dto.LibrarianOptionDTO o = new com.project.resourcivo.dto.LibrarianOptionDTO();
            o.setId(l.getId());
            o.setName((l.getFirstName() + " " + l.getLastName()).trim());
            if (l.getLibrary() != null) {
                o.setLibraryId(l.getLibrary().getId());
                o.setLibraryName(l.getLibrary().getName());
            }
            return o;
        }).sorted(java.util.Comparator.comparing(com.project.resourcivo.dto.LibrarianOptionDTO::getName,
                String.CASE_INSENSITIVE_ORDER)).collect(Collectors.toList());
    }
}
