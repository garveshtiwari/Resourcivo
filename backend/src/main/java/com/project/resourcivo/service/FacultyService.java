package com.project.resourcivo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.resourcivo.criteria.FacultyFilterDTO;
import com.project.resourcivo.dto.FacultyCreateDTO;
import com.project.resourcivo.dto.FacultyResponseDTO;
import com.project.resourcivo.dto.FacultyUpdateDTO;
import com.project.resourcivo.mapper.FacultyMapper;
import com.project.resourcivo.model.Faculty;
import com.project.resourcivo.repository.FacultyRepository;
import com.project.resourcivo.specification.FacultySpecification;

@Service
public class FacultyService implements IFacultyService {

    private final FacultyRepository facultyRepository;
    private final com.project.resourcivo.repository.SubjectRepository subjectRepository;
    private final com.project.resourcivo.repository.UserRepository userRepository;

    public FacultyService(FacultyRepository facultyRepository,
            com.project.resourcivo.repository.SubjectRepository subjectRepository,
            com.project.resourcivo.repository.UserRepository userRepository) {
        this.facultyRepository = facultyRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    // ---------------- Full CRUD (existing)
    @Override
    public Faculty addFaculty(Faculty faculty) {
        return facultyRepository.save(faculty);
    }

    @Override
    @Cacheable(value = "faculty", key = "'all'")
    public List<Faculty> getAllFaculty() {
        return facultyRepository.findAll();
    }

    @Override
    @Cacheable(value = "faculty", key = "#id")
    public Faculty getFacultyById(Long id) {
        return facultyRepository.findById(id).orElse(null);
    }

    @Override
    @CacheEvict(value = "faculty", allEntries = true)
    public Faculty updateFaculty(Long id, Faculty updated) {
        return facultyRepository.findById(id).map(existing -> {
            existing.setFirstName(updated.getFirstName());
            existing.setMiddleName(updated.getMiddleName());
            existing.setLastName(updated.getLastName());
            existing.setDateOfBirth(updated.getDateOfBirth());
            existing.setCurrentAddress(updated.getCurrentAddress());
            existing.setPermanentAddress(updated.getPermanentAddress());
            existing.setContact(updated.getContact());
            existing.setDateOfJoining(updated.getDateOfJoining());
            existing.setLevel(updated.getLevel());
            existing.setSubject(updated.getSubject());
            existing.setYearOfExperience(updated.getYearOfExperience());
            existing.setBio(updated.getBio());
            return facultyRepository.save(existing);
        }).orElse(null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "faculty", allEntries = true)
    public void deleteFaculty(Long id) {
        facultyRepository.deleteById(id);
    }

    @Override
    @Transactional
    public FacultyResponseDTO createFromDto(FacultyCreateDTO dto) {
        Faculty f = FacultyMapper.toEntity(dto);
        resolveSubjectById(f, dto.getSubject());
        Faculty saved = facultyRepository.save(f);
        return FacultyMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public FacultyResponseDTO updateFromDto(Long id, FacultyCreateDTO dto) {
        return facultyRepository.findById(id).map(existing -> {
            // map all fields from create-dto (full replace for fields provided)
            Faculty updated = FacultyMapper.toEntity(dto);
            resolveSubjectById(updated, dto.getSubject());
            if (updated.getGender() != null)
                existing.setGender(updated.getGender());
            // keep id and any fields that must not be overwritten from existing if dto had
            // nulls
            if (updated.getFirstName() != null)
                existing.setFirstName(updated.getFirstName());
            existing.setMiddleName(updated.getMiddleName());
            if (updated.getLastName() != null)
                existing.setLastName(updated.getLastName());
            if (updated.getDateOfBirth() != null)
                existing.setDateOfBirth(updated.getDateOfBirth());
            if (updated.getCurrentAddress() != null)
                existing.setCurrentAddress(updated.getCurrentAddress());
            if (updated.getPermanentAddress() != null)
                existing.setPermanentAddress(updated.getPermanentAddress());
            if (updated.getContact() != null)
                existing.setContact(updated.getContact());
            if (updated.getDateOfJoining() != null)
                existing.setDateOfJoining(updated.getDateOfJoining());
            if (updated.getLevel() != null)
                existing.setLevel(updated.getLevel());
            if (updated.getSubject() != null)
                existing.setSubject(updated.getSubject());
            if (updated.getYearOfExperience() != null)
                existing.setYearOfExperience(updated.getYearOfExperience());
            if (updated.getBio() != null)
                existing.setBio(updated.getBio());
            Faculty s = facultyRepository.save(existing);
            return FacultyMapper.toResponse(s);
        }).orElse(null);
    }

    @Override
    @Transactional
    public FacultyResponseDTO partialUpdateFromDto(Long id, FacultyUpdateDTO dto) {
        return facultyRepository.findById(id).map(existing -> {
            FacultyMapper.mergeUpdate(dto, existing);
            resolveSubjectById(existing, dto.getSubject());
            Faculty saved = facultyRepository.save(existing);
            return FacultyMapper.toResponse(saved);
        }).orElse(null);
    }

    // ---------------- Specification search
    @Override
    public List<FacultyResponseDTO> search(FacultyFilterDTO filter) {
        return facultyRepository.findAll(FacultySpecification.build(filter), filter.paging()).getContent()
                .stream().map(FacultyMapper::toResponse).collect(Collectors.toList());
    }

    private com.project.resourcivo.model.Subject resolveSubjectFromRef(com.project.resourcivo.dto.SubjectRefDTO sref) {
        if (sref == null)
            return null;
        if (sref.getId() != null) {
            return subjectRepository.findById(sref.getId())
                    .orElseThrow(() -> new com.project.resourcivo.exception.ResourceNotFoundException("Subject", "id",
                            sref.getId()));
        }
        // fallback: try find by name (not implemented - returning new Subject stub)
        com.project.resourcivo.model.Subject s = new com.project.resourcivo.model.Subject();
        s.setName(sref.getName());
        return s;
    }


    // ---------------------------------------------------------------- DTO reads, self-service, linking

    /** If only a subject id was sent (no name), store that subject's name. */
    private void resolveSubjectById(Faculty target, com.project.resourcivo.dto.SubjectRefDTO ref) {
        if (ref == null || (ref.getName() != null && !ref.getName().isBlank()) || ref.getId() == null) {
            return;
        }
        subjectRepository.findById(ref.getId()).ifPresent(subject -> target.setSubject(subject.getName()));
    }

    @Override
    public FacultyResponseDTO getByIdDto(Long id) {
        return facultyRepository.findById(id).map(FacultyMapper::toResponse).orElse(null);
    }

    @Override
    public List<FacultyResponseDTO> getAllDto() {
        return facultyRepository.findAll().stream().map(FacultyMapper::toResponse).collect(Collectors.toList());
    }

    private Faculty findOrClaim(com.project.resourcivo.model.User user) {
        java.util.Optional<Faculty> own = facultyRepository.findByUserId(user.getId());
        if (own.isPresent()) {
            return own.get();
        }
        if (user.getEmail() != null) {
            java.util.Optional<Faculty> byEmail = facultyRepository
                    .findFirstByContactPrimaryEmailIgnoreCaseAndUserIdIsNull(user.getEmail());
            if (byEmail.isPresent()) {
                Faculty faculty = byEmail.get();
                faculty.setUserId(user.getId());
                return facultyRepository.save(faculty);
            }
        }
        return null;
    }

    private FacultyResponseDTO toProfile(Faculty faculty) {
        FacultyResponseDTO dto = FacultyMapper.toResponse(faculty);
        dto.setContact(com.project.resourcivo.mapper.ContactMapper.toResponse(faculty.getContact()));
        dto.setCurrentAddress(com.project.resourcivo.mapper.AddressMapper.toResponse(faculty.getCurrentAddress()));
        return dto;
    }

    @Override
    @Transactional
    public FacultyResponseDTO getMine(com.project.resourcivo.model.User user) {
        Faculty faculty = findOrClaim(user);
        return faculty == null ? null : toProfile(faculty);
    }

    @Override
    @Transactional
    @CacheEvict(value = "faculty", allEntries = true)
    public FacultyResponseDTO createMine(com.project.resourcivo.model.User user, FacultyCreateDTO dto) {
        if (findOrClaim(user) != null) {
            throw new IllegalStateException("You already have a faculty profile");
        }
        if (dto.getContact() == null) {
            throw new IllegalArgumentException("Phone number and email are required");
        }
        if (user.getFirstName() != null && !user.getFirstName().isBlank()
                && user.getLastName() != null && !user.getLastName().isBlank()) {
            dto.setFirstName(user.getFirstName());
            dto.setLastName(user.getLastName());
        } else {
            user.setFirstName(dto.getFirstName());
            user.setLastName(dto.getLastName());
            userRepository.save(user);
        }
        Faculty faculty = FacultyMapper.toEntity(dto);
        resolveSubjectById(faculty, dto.getSubject());
        faculty.setUserId(user.getId());
        return toProfile(facultyRepository.save(faculty));
    }

    @Override
    @Transactional
    @CacheEvict(value = "faculty", allEntries = true)
    public FacultyResponseDTO updateMine(com.project.resourcivo.model.User user, FacultyUpdateDTO dto) {
        Faculty faculty = findOrClaim(user);
        if (faculty == null) {
            throw new com.project.resourcivo.exception.ResourceNotFoundException(
                    "Faculty profile not found. Create it first.");
        }
        dto.setFirstName(null);
        dto.setLastName(null);
        FacultyMapper.mergeUpdate(dto, faculty);
        resolveSubjectById(faculty, dto.getSubject());
        return toProfile(facultyRepository.save(faculty));
    }
}