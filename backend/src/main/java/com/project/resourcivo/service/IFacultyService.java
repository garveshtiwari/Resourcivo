package com.project.resourcivo.service;

import java.util.List;

import com.project.resourcivo.criteria.FacultyFilterDTO;
import com.project.resourcivo.dto.FacultyCreateDTO;
import com.project.resourcivo.dto.FacultyResponseDTO;
import com.project.resourcivo.dto.FacultyUpdateDTO;
import com.project.resourcivo.model.Faculty;

public interface IFacultyService {

    // Existing CRUD (kept)
    Faculty addFaculty(Faculty faculty);
    List<Faculty> getAllFaculty();
    Faculty getFacultyById(Long id);
    Faculty updateFaculty(Long id, Faculty faculty);
    void deleteFaculty(Long id);

    // New DTO-based APIs
    FacultyResponseDTO createFromDto(FacultyCreateDTO dto);
    FacultyResponseDTO updateFromDto(Long id, FacultyCreateDTO dto); // full update via DTO
    FacultyResponseDTO partialUpdateFromDto(Long id, FacultyUpdateDTO dto); // PATCH

    // search
    List<FacultyResponseDTO> search(FacultyFilterDTO filter);

    FacultyResponseDTO getByIdDto(Long id);

    List<FacultyResponseDTO> getAllDto();

    /** The record that belongs to this login (claims a matching record by verified email). Null if none. */
    FacultyResponseDTO getMine(com.project.resourcivo.model.User user);

    /** Self-service create. First/last name always come from the account. */
    FacultyResponseDTO createMine(com.project.resourcivo.model.User user, FacultyCreateDTO dto);

    /** Self-service update. Name cannot be changed here. */
    FacultyResponseDTO updateMine(com.project.resourcivo.model.User user, FacultyUpdateDTO dto);
}
