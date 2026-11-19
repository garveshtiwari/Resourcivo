package com.project.resourcivo.mapper;

import com.project.resourcivo.model.Faculty;
import com.project.resourcivo.dto.FacultyCreateDTO;
import com.project.resourcivo.dto.FacultyUpdateDTO;
import com.project.resourcivo.dto.FacultyResponseDTO;

public final class FacultyMapper {

    private FacultyMapper() {
    }

    public static Faculty toEntity(FacultyCreateDTO dto) {
        if (dto == null)
            return null;
        Faculty e = new Faculty();
        if (dto.getFirstName() != null)
            e.setFirstName(dto.getFirstName());
        if (dto.getMiddleName() != null)
            e.setMiddleName(dto.getMiddleName());
        if (dto.getLastName() != null)
            e.setLastName(dto.getLastName());
        if (dto.getDateOfBirth() != null)
            e.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getBio() != null)
            e.setBio(dto.getBio());
        if (dto.getDateOfJoining() != null)
            e.setDateOfJoining(dto.getDateOfJoining());
        if (dto.getLevel() != null)
            e.setLevel(dto.getLevel());
        if (dto.getYearOfExperience() != null)
            e.setYearOfExperience(dto.getYearOfExperience());
        if (dto.getGender() != null)
            e.setGender(dto.getGender());
        if (dto.getSubject() != null && dto.getSubject().getName() != null && !dto.getSubject().getName().isBlank())
            e.setSubject(dto.getSubject().getName().trim());
        if (dto.getContact() != null)
            e.setContact(ContactMapper.toEntity(dto.getContact()));
        if (dto.getCurrentAddress() != null)
            e.setCurrentAddress(AddressMapper.toEntity(dto.getCurrentAddress()));
        if (dto.getPermanentAddress() != null)
            e.setPermanentAddress(AddressMapper.toEntity(dto.getPermanentAddress()));
        return e;
    }

    public static void mergeUpdate(FacultyUpdateDTO dto, Faculty entity) {
        if (dto == null || entity == null)
            return;
        if (dto.getFirstName() != null)
            entity.setFirstName(dto.getFirstName());
        if (dto.getMiddleName() != null)
            entity.setMiddleName(dto.getMiddleName());
        if (dto.getLastName() != null)
            entity.setLastName(dto.getLastName());
        if (dto.getDateOfBirth() != null)
            entity.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getBio() != null)
            entity.setBio(dto.getBio());
        if (dto.getDateOfJoining() != null)
            entity.setDateOfJoining(dto.getDateOfJoining());
        if (dto.getLevel() != null)
            entity.setLevel(dto.getLevel());
        if (dto.getYearOfExperience() != null)
            entity.setYearOfExperience(dto.getYearOfExperience());
        if (dto.getGender() != null)
            entity.setGender(dto.getGender());
        if (dto.getSubject() != null && dto.getSubject().getName() != null && !dto.getSubject().getName().isBlank())
            entity.setSubject(dto.getSubject().getName().trim());
        if (dto.getContact() != null) {
            if (entity.getContact() == null) {
                entity.setContact(ContactMapper.toEntity(dto.getContact()));
            } else {
                com.project.resourcivo.model.Contact c = entity.getContact();
                if (dto.getContact().getPrimaryNumber() != null)
                    c.setPrimaryNumber(dto.getContact().getPrimaryNumber());
                if (dto.getContact().getAlternateNumber() != null)
                    c.setAlternateNumber(dto.getContact().getAlternateNumber());
                if (dto.getContact().getPrimaryEmail() != null)
                    c.setPrimaryEmail(dto.getContact().getPrimaryEmail());
                if (dto.getContact().getAlternateEmail() != null)
                    c.setAlternateEmail(dto.getContact().getAlternateEmail());
            }
        }
        if (dto.getCurrentAddress() != null) {
            if (entity.getCurrentAddress() == null) {
                entity.setCurrentAddress(AddressMapper.toEntity(dto.getCurrentAddress()));
            } else {
                AddressMapper.updateEntity(dto.getCurrentAddress(), entity.getCurrentAddress());
            }
        }
    }

    public static FacultyResponseDTO toResponse(Faculty e) {
        if (e == null)
            return null;
        FacultyResponseDTO r = new FacultyResponseDTO();
        r.setId(e.getId());
        r.setFirstName(e.getFirstName());
        r.setMiddleName(e.getMiddleName());
        r.setLastName(e.getLastName());
        r.setDateOfBirth(e.getDateOfBirth());
        r.setBio(e.getBio());
        r.setDateOfJoining(e.getDateOfJoining());
        r.setLevel(e.getLevel());
        r.setYearOfExperience(e.getYearOfExperience());
        r.setGender(e.getGender());
        r.setUserId(e.getUserId());
        if (e.getSubject() != null) {
            com.project.resourcivo.dto.SubjectRefDTO subject = new com.project.resourcivo.dto.SubjectRefDTO();
            subject.setName(e.getSubject());
            r.setSubject(subject);
        }
        if (e.getContact() != null) {
            r.setContactId(e.getContact().getId());
        }
        return r;
    }
}
