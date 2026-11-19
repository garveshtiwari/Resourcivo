package com.project.resourcivo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.project.resourcivo.model.InventoryItem;

@Repository
public interface InventoryItemRepository
        extends JpaRepository<InventoryItem, Long>, JpaSpecificationExecutor<InventoryItem> {

    @org.springframework.data.jpa.repository.Query("select i from InventoryItem i where i.quantity <= i.reorderLevel order by i.name")
    java.util.List<InventoryItem> findLowStock();

    @org.springframework.data.jpa.repository.Query("select count(i) from InventoryItem i where i.quantity <= i.reorderLevel")
    long countLowStock();

}
