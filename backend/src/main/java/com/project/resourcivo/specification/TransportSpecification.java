package com.project.resourcivo.specification;

import com.project.resourcivo.criteria.TransportFilterDTO;
import com.project.resourcivo.model.Transport;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class TransportSpecification {

    private static Predicate like(jakarta.persistence.criteria.CriteriaBuilder cb, jakarta.persistence.criteria.Expression<String> path, String value) {
        return cb.like(cb.lower(path), "%" + value.trim().toLowerCase() + "%");
    }

    public static Specification<Transport> build(TransportFilterDTO f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f == null) {
                return cb.conjunction();
            }
            if (StringUtils.hasText(f.getVehicleName())) p.add(like(cb, root.get("vehicleName"), f.getVehicleName()));
            if (StringUtils.hasText(f.getRoutes())) p.add(like(cb, root.get("routes"), f.getRoutes()));
            if (f.getIsActive() != null) p.add(cb.equal(root.get("isActive"), f.getIsActive()));
            if (Boolean.TRUE.equals(f.getHasSeats())) p.add(cb.greaterThan(root.<Integer>get("availableSeats"), 0));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
