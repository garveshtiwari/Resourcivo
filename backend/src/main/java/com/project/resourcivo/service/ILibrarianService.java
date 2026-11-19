package com.project.resourcivo.service;

import com.project.resourcivo.dto.LibrarianCreateDTO;
import com.project.resourcivo.dto.LibrarianResponseDTO;
import com.project.resourcivo.dto.LibrarianUpdateDTO;
import java.util.List;

public interface ILibrarianService {
    LibrarianResponseDTO createFromDto(LibrarianCreateDTO dto);

    LibrarianResponseDTO updateFromDto(Long id, LibrarianUpdateDTO dto);

    LibrarianResponseDTO getById(Long id);

    List<LibrarianResponseDTO> getAll();

    LibrarianResponseDTO getByUserId(Long userId);

    /** Self-service: phone, date of birth and bio only. Null if this login has no librarian record. */
    LibrarianResponseDTO updateMine(Long userId, com.project.resourcivo.dto.LibrarianSelfUpdateDTO dto);

    void delete(Long id);
}
