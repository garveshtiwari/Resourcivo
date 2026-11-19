package com.project.resourcivo.specification;

import com.project.resourcivo.criteria.CourseFilterDTO;
import com.project.resourcivo.model.Course;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class CourseSpecification {

    private static Predicate like(jakarta.persistence.criteria.CriteriaBuilder cb, jakarta.persistence.criteria.Expression<String> path, String value) {
        return cb.like(cb.lower(path), "%" + value.trim().toLowerCase() + "%");
    }

    public static Specification<Course> build(CourseFilterDTO f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f == null) {
                return cb.conjunction();
            }
            if (StringUtils.hasText(f.getName())) p.add(like(cb, root.get("name"), f.getName()));
            if (StringUtils.hasText(f.getCode())) p.add(like(cb, root.get("code"), f.getCode()));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
