package com.project.resourcivo.service;

import com.project.resourcivo.dto.LibraryCreateDTO;
import com.project.resourcivo.dto.LibraryResponseDTO;
import com.project.resourcivo.dto.LibraryUpdateDTO;
import java.util.List;

public interface ILibraryService {
    LibraryResponseDTO createFromDto(LibraryCreateDTO dto);

    LibraryResponseDTO updateFromDto(Long id, LibraryUpdateDTO dto);

    LibraryResponseDTO getById(Long id);

    List<LibraryResponseDTO> getAll();

    /** Librarians that can be chosen to manage a library, with the library each one manages now. */
    List<com.project.resourcivo.dto.LibrarianOptionDTO> getLibrarianOptions();

    /** @return false if the library does not exist; throws if it still has books or a librarian. */
    boolean delete(Long id);
}
