package com.project.resourcivo.specification;

import com.project.resourcivo.criteria.InventoryItemFilterDTO;
import com.project.resourcivo.model.InventoryItem;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class InventoryItemSpecification {

    private static Predicate like(jakarta.persistence.criteria.CriteriaBuilder cb, jakarta.persistence.criteria.Expression<String> path, String value) {
        return cb.like(cb.lower(path), "%" + value.trim().toLowerCase() + "%");
    }

    public static Specification<InventoryItem> build(InventoryItemFilterDTO f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f == null) {
                return cb.conjunction();
            }
            if (StringUtils.hasText(f.getName())) p.add(like(cb, root.get("name"), f.getName()));
            if (StringUtils.hasText(f.getSku())) p.add(like(cb, root.get("sku"), f.getSku()));
            if (StringUtils.hasText(f.getSupplier())) p.add(like(cb, root.get("supplier"), f.getSupplier()));
            if (StringUtils.hasText(f.getCategory())) p.add(cb.equal(root.get("category").as(String.class), f.getCategory().trim().toUpperCase()));
            if (Boolean.TRUE.equals(f.getLowStockOnly())) p.add(cb.le(root.<Integer>get("quantity"), root.<Integer>get("reorderLevel")));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
