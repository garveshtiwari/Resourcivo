package com.project.resourcivo.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class RoleUpdateRequest {
    @NotEmpty(message = "At least one role is required")
    private List<String> roles;

    public RoleUpdateRequest() {
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

}
