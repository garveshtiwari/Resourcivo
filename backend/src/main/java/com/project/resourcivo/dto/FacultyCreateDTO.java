package com.project.resourcivo.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

public class FacultyCreateDTO {

    @NotBlank @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String middleName;

    @NotBlank @Size(max = 100)
    private String lastName;

    @Past
    private LocalDate dateOfBirth;

    private String gender;

    @Valid
    private AddressCreateDTO currentAddress;

    @Valid
    private AddressCreateDTO permanentAddress;

    @Valid
    private ContactCreateDTO contact;

    @Valid
    private List<EmergencyContactDTO> emergencyContact;

    @Size(max = 1000)
    private String bio;

    // Faculty-specific
    private LocalDate dateOfJoining;

    @Size(max = 50)
    private String level;

    @Valid
    private SubjectRefDTO subject;

    private Integer yearOfExperience;

    // getters & setters
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public AddressCreateDTO getCurrentAddress() { return currentAddress; }
    public void setCurrentAddress(AddressCreateDTO currentAddress) { this.currentAddress = currentAddress; }
    public AddressCreateDTO getPermanentAddress() { return permanentAddress; }
    public void setPermanentAddress(AddressCreateDTO permanentAddress) { this.permanentAddress = permanentAddress; }
    public ContactCreateDTO getContact() { return contact; }
    public void setContact(ContactCreateDTO contact) { this.contact = contact; }
    public List<EmergencyContactDTO> getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(List<EmergencyContactDTO> emergencyContact) { this.emergencyContact = emergencyContact; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public SubjectRefDTO getSubject() { return subject; }
    public void setSubject(SubjectRefDTO subject) { this.subject = subject; }
    public Integer getYearOfExperience() { return yearOfExperience; }
    public void setYearOfExperience(Integer yearOfExperience) { this.yearOfExperience = yearOfExperience; }
}
