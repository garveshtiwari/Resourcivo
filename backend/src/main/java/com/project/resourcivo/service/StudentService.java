package com.project.resourcivo.service;

import org.springframework.cache.annotation.CacheEvict;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;
import java.util.List;
import com.project.resourcivo.repository.StudentRepository;
import com.project.resourcivo.mapper.StudentMapper;
import com.project.resourcivo.model.Student;
import com.project.resourcivo.dto.StudentCreateDTO;
import com.project.resourcivo.dto.StudentUpdateDTO;
import com.project.resourcivo.dto.StudentResponseDTO;
import com.project.resourcivo.criteria.StudentFilterDTO;
import com.project.resourcivo.specification.StudentSpecification;
import com.project.resourcivo.exception.ResourceNotFoundException;

@Service
public class StudentService implements IStudentService {

    private final StudentRepository repo;
    private final com.project.resourcivo.repository.EmergencyContactRepository emergencyRepo;
    private final com.project.resourcivo.repository.UserRepository userRepository;
    private final com.project.resourcivo.security.CurrentUser currentUser;

    public StudentService(StudentRepository repo,
            com.project.resourcivo.repository.EmergencyContactRepository emergencyRepo,
            com.project.resourcivo.repository.UserRepository userRepository,
            com.project.resourcivo.security.CurrentUser currentUser) {
        this.repo = repo;
        this.emergencyRepo = emergencyRepo;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional
    public StudentResponseDTO createFromDto(StudentCreateDTO dto) {
        Student e = StudentMapper.toEntity(dto);
        var saved = repo.save(e);
        return StudentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public StudentResponseDTO updateFromDto(Long id, StudentCreateDTO dto) {
        return repo.findById(id).map(existing -> {
            StudentMapper.updateEntity(dto, existing);
            var s = repo.save(existing);
            return StudentMapper.toResponse(s);
        }).orElse(null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public StudentResponseDTO partialUpdateFromDto(Long id, StudentUpdateDTO dto) {
        return repo.findById(id).map(existing -> {
            StudentMapper.mergeUpdate(dto, existing);
            var s = repo.save(existing);
            return StudentMapper.toResponse(s);
        }).orElse(null);
    }

    @Override
    public List<StudentResponseDTO> search(StudentFilterDTO filter) {
        return repo.findAll(StudentSpecification.build(filter), filter.paging()).getContent().stream().map(StudentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StudentResponseDTO addEmergencyContact(Long studentId,
            com.project.resourcivo.dto.EmergencyContactCreateDTO dto) {
        Student student = repo.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));
        currentUser.requireSelfOrAdmin(student.getUserId());

        if (student.getEmergencyContacts() != null && student.getEmergencyContacts().size() >= 2) {
            throw new IllegalStateException("Maximum of 2 emergency contacts allowed");
        }

        com.project.resourcivo.model.EmergencyContact contact = com.project.resourcivo.mapper.EmergencyContactMapper
                .toEntity(dto);

        if (student.getEmergencyContacts() == null) {
            student.setEmergencyContacts(new java.util.ArrayList<>());
        }

        student.getEmergencyContacts().add(contact);
        return StudentMapper.toResponse(repo.save(student));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
        }
    }

    @Override
    public List<StudentResponseDTO> getAll() {
        return repo.findAll().stream().map(StudentMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<StudentResponseDTO> findByCourse(String course) {
        return repo.findByCourse(course).stream().map(StudentMapper::toResponse).collect(Collectors.toList());
    }

    // ---------------------------------------------------------------- self-service / linking

    @Override
    public StudentResponseDTO getById(Long id) {
        return repo.findById(id).map(StudentMapper::toResponse).orElse(null);
    }

    /** Find the student that belongs to this login, claiming a matching record by verified email if needed. */
    private Student findOrClaim(com.project.resourcivo.model.User user) {
        java.util.Optional<Student> own = repo.findByUserId(user.getId());
        if (own.isPresent()) {
            return own.get();
        }
        if (user.getEmail() != null) {
            java.util.Optional<Student> byEmail = repo
                    .findFirstByContactPrimaryEmailIgnoreCaseAndUserIdIsNull(user.getEmail());
            if (byEmail.isPresent()) {
                Student student = byEmail.get();
                student.setUserId(user.getId());
                return repo.save(student);
            }
        }
        return null;
    }

    private StudentResponseDTO toProfile(Student student) {
        StudentResponseDTO dto = StudentMapper.toResponse(student);
        dto.setContact(com.project.resourcivo.mapper.ContactMapper.toResponse(student.getContact()));
        dto.setCurrentAddress(com.project.resourcivo.mapper.AddressMapper.toResponse(student.getCurrentAddress()));
        return dto;
    }

    @Override
    @Transactional
    public StudentResponseDTO getMine(com.project.resourcivo.model.User user) {
        Student student = findOrClaim(user);
        return student == null ? null : toProfile(student);
    }

    @Override
    @Transactional
    public Long idOfMine(com.project.resourcivo.model.User user) {
        Student student = findOrClaim(user);
        return student == null ? null : student.getId();
    }

    @Override
    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public StudentResponseDTO createMine(com.project.resourcivo.model.User user, StudentCreateDTO dto) {
        if (findOrClaim(user) != null) {
            throw new IllegalStateException("You already have a student profile");
        }
        if (dto.getContact() == null) {
            throw new IllegalArgumentException("Phone number and email are required");
        }
        // First/last name belong to the account. Older accounts without names save them once here.
        if (user.getFirstName() != null && !user.getFirstName().isBlank()
                && user.getLastName() != null && !user.getLastName().isBlank()) {
            dto.setFirstName(user.getFirstName());
            dto.setLastName(user.getLastName());
        } else {
            user.setFirstName(dto.getFirstName());
            user.setLastName(dto.getLastName());
            userRepository.save(user);
        }
        dto.setCourse(null); // an admin assigns the course
        Student student = StudentMapper.toEntity(dto);
        student.setUserId(user.getId());
        return toProfile(repo.save(student));
    }

    @Override
    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public StudentResponseDTO updateMine(com.project.resourcivo.model.User user, StudentUpdateDTO dto) {
        Student student = findOrClaim(user);
        if (student == null) {
            throw new ResourceNotFoundException("Student profile not found. Create it first.");
        }
        dto.setFirstName(null);
        dto.setLastName(null);
        dto.setCourse(null);
        dto.setDateOfJoining(null);
        StudentMapper.mergeUpdate(dto, student);

        if (dto.getContact() != null) {
            if (student.getContact() == null) {
                student.setContact(com.project.resourcivo.mapper.ContactMapper.toEntity(dto.getContact()));
            } else {
                com.project.resourcivo.mapper.ContactMapper.mergeFrom(dto.getContact(), student.getContact());
            }
        }
        if (dto.getCurrentAddress() != null) {
            if (student.getCurrentAddress() == null) {
                student.setCurrentAddress(com.project.resourcivo.mapper.AddressMapper.toEntity(dto.getCurrentAddress()));
            } else {
                com.project.resourcivo.mapper.AddressMapper.updateEntity(dto.getCurrentAddress(),
                        student.getCurrentAddress());
            }
        }
        return toProfile(repo.save(student));
    }

    @Override
    public java.util.List<com.project.resourcivo.dto.EmergencyContactResponseDTO> listEmergencyContacts(Long studentId) {
        Student student = repo.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));
        currentUser.requireSelfOrAdmin(student.getUserId());
        if (student.getEmergencyContacts() == null) {
            return new java.util.ArrayList<>();
        }
        return student.getEmergencyContacts().stream()
                .map(com.project.resourcivo.mapper.EmergencyContactMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeEmergencyContact(Long studentId, Long contactId) {
        Student student = repo.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));
        currentUser.requireSelfOrAdmin(student.getUserId());
        com.project.resourcivo.model.EmergencyContact target = null;
        if (student.getEmergencyContacts() != null) {
            for (com.project.resourcivo.model.EmergencyContact ec : student.getEmergencyContacts()) {
                if (contactId.equals(ec.getId())) {
                    target = ec;
                    break;
                }
            }
        }
        if (target == null) {
            throw new ResourceNotFoundException("Emergency contact not found for this student");
        }
        student.getEmergencyContacts().remove(target);
        repo.save(student);
        emergencyRepo.delete(target);
    }
}
