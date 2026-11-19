package com.project.resourcivo.criteria;

public class TransportFilterDTO extends PageableFilter {
    private String vehicleName;

    private String routes;

    private Boolean isActive;

    private Boolean hasSeats;

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getRoutes() {
        return routes;
    }

    public void setRoutes(String routes) {
        this.routes = routes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getHasSeats() {
        return hasSeats;
    }

    public void setHasSeats(Boolean hasSeats) {
        this.hasSeats = hasSeats;
    }
}
