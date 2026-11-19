package com.project.resourcivo.service;

import java.util.List;
import com.project.resourcivo.dto.StudentCreateDTO;
import com.project.resourcivo.dto.StudentUpdateDTO;
import com.project.resourcivo.dto.StudentResponseDTO;
import com.project.resourcivo.criteria.StudentFilterDTO;

public interface IStudentService {
    StudentResponseDTO createFromDto(StudentCreateDTO dto);

    StudentResponseDTO updateFromDto(Long id, StudentCreateDTO dto);

    StudentResponseDTO partialUpdateFromDto(Long id, StudentUpdateDTO dto);

    java.util.List<StudentResponseDTO> search(StudentFilterDTO filter);

    StudentResponseDTO addEmergencyContact(Long studentId, com.project.resourcivo.dto.EmergencyContactCreateDTO dto);

    void delete(Long id);

    List<StudentResponseDTO> getAll();

    List<StudentResponseDTO> findByCourse(String course);

    StudentResponseDTO getById(Long id);

    /** The record that belongs to this login (claims a matching admin-created record by verified email). Null if none. */
    StudentResponseDTO getMine(com.project.resourcivo.model.User user);

    /** Self-service create. First/last name always come from the account. */
    StudentResponseDTO createMine(com.project.resourcivo.model.User user, StudentCreateDTO dto);

    /** Self-service update. Name, course and joining date cannot be changed here. */
    StudentResponseDTO updateMine(com.project.resourcivo.model.User user, StudentUpdateDTO dto);

    java.util.List<com.project.resourcivo.dto.EmergencyContactResponseDTO> listEmergencyContacts(Long studentId);

    void removeEmergencyContact(Long studentId, Long contactId);

    Long idOfMine(com.project.resourcivo.model.User user);
}
