package com.project.resourcivo.dto;

import jakarta.validation.constraints.*;

public class EnabledRequest {
    @NotNull(message = "enabled is required")
    private Boolean enabled;

    public EnabledRequest() {
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

}
