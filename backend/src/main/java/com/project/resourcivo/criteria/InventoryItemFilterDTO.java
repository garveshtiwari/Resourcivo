package com.project.resourcivo.criteria;

public class InventoryItemFilterDTO extends PageableFilter {
    private String name;

    private String sku;

    private String category;

    private String supplier;

    private Boolean lowStockOnly;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public Boolean getLowStockOnly() {
        return lowStockOnly;
    }

    public void setLowStockOnly(Boolean lowStockOnly) {
        this.lowStockOnly = lowStockOnly;
    }
}
