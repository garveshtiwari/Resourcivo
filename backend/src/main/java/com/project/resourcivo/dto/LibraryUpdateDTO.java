package com.project.resourcivo.dto;

public class LibraryUpdateDTO {
    // null = leave unchanged, but a value must not be blank
    @jakarta.validation.constraints.Pattern(regexp = ".*\\S.*", message = "Library name cannot be blank")
    private String name;

    @jakarta.validation.constraints.Pattern(regexp = ".*\\S.*", message = "Location cannot be blank")
    private String location;

    // Assign this librarian; use clearLibrarian to remove the current one
    private Long librarianId;
    private Boolean clearLibrarian;

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

    public Boolean getClearLibrarian() {
        return clearLibrarian;
    }

    public void setClearLibrarian(Boolean clearLibrarian) {
        this.clearLibrarian = clearLibrarian;
    }
}
