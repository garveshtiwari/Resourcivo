package com.project.resourcivo.specification;

import com.project.resourcivo.criteria.ClassroomFilterDTO;
import com.project.resourcivo.model.Classroom;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class ClassroomSpecification {

    private static Predicate like(jakarta.persistence.criteria.CriteriaBuilder cb, jakarta.persistence.criteria.Expression<String> path, String value) {
        return cb.like(cb.lower(path), "%" + value.trim().toLowerCase() + "%");
    }

    public static Specification<Classroom> build(ClassroomFilterDTO f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f == null) {
                return cb.conjunction();
            }
            if (StringUtils.hasText(f.getName())) p.add(like(cb, root.get("name"), f.getName()));
            if (f.getMinCapacity() != null) p.add(cb.greaterThanOrEqualTo(root.get("capacity"), f.getMinCapacity()));
            if (f.getIsAvailable() != null) p.add(cb.equal(root.get("isAvailable"), f.getIsAvailable()));
            if (f.getHasProjector() != null) p.add(cb.equal(root.get("hasProjector"), f.getHasProjector()));
            if (f.getHasSmartboard() != null) p.add(cb.equal(root.get("hasSmartboard"), f.getHasSmartboard()));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
