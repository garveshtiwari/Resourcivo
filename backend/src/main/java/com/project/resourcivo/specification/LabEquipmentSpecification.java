package com.project.resourcivo.specification;

import com.project.resourcivo.criteria.LabEquipmentFilterDTO;
import com.project.resourcivo.model.LabEquipment;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class LabEquipmentSpecification {

    private static Predicate like(jakarta.persistence.criteria.CriteriaBuilder cb, jakarta.persistence.criteria.Expression<String> path, String value) {
        return cb.like(cb.lower(path), "%" + value.trim().toLowerCase() + "%");
    }

    public static Specification<LabEquipment> build(LabEquipmentFilterDTO f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f == null) {
                return cb.conjunction();
            }
            if (StringUtils.hasText(f.getName())) p.add(like(cb, root.get("name"), f.getName()));
            if (StringUtils.hasText(f.getCategory())) p.add(like(cb, root.get("category"), f.getCategory()));
            if (StringUtils.hasText(f.getLabType())) p.add(cb.equal(root.get("labType").as(String.class), f.getLabType().trim().toUpperCase()));
            if (StringUtils.hasText(f.getStatus())) p.add(cb.equal(root.get("status").as(String.class), f.getStatus().trim().toUpperCase()));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
