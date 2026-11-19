package com.project.resourcivo.dto;

import jakarta.validation.constraints.NotBlank;

public class LibraryCreateDTO {
    @NotBlank(message = "Library name is required")
    private String name;

    @NotBlank(message = "Location is required")
    private String location;

    // Optional: the librarian who manages this library
    private Long librarianId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Long getLibrarianId() {
        return librarianId;
    }

    public void setLibrarianId(Long librarianId) {
        this.librarianId = librarianId;
    }
}
