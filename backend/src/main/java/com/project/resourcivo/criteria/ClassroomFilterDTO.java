package com.project.resourcivo.criteria;

public class ClassroomFilterDTO extends PageableFilter {
    private String name;

    private Integer minCapacity;

    private Boolean isAvailable;

    private Boolean hasProjector;

    private Boolean hasSmartboard;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMinCapacity() {
        return minCapacity;
    }

    public void setMinCapacity(Integer minCapacity) {
        this.minCapacity = minCapacity;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public Boolean getHasProjector() {
        return hasProjector;
    }

    public void setHasProjector(Boolean hasProjector) {
        this.hasProjector = hasProjector;
    }

    public Boolean getHasSmartboard() {
        return hasSmartboard;
    }

    public void setHasSmartboard(Boolean hasSmartboard) {
        this.hasSmartboard = hasSmartboard;
    }
}
