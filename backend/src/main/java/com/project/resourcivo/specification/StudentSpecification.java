package com.project.resourcivo.specification;

import com.project.resourcivo.criteria.StudentFilterDTO;
import com.project.resourcivo.model.Student;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class StudentSpecification {

    private static Predicate like(jakarta.persistence.criteria.CriteriaBuilder cb, jakarta.persistence.criteria.Expression<String> path, String value) {
        return cb.like(cb.lower(path), "%" + value.trim().toLowerCase() + "%");
    }

    public static Specification<Student> build(StudentFilterDTO f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f == null) {
                return cb.conjunction();
            }
            if (StringUtils.hasText(f.getFirstName())) p.add(like(cb, root.get("firstName"), f.getFirstName()));
            if (StringUtils.hasText(f.getLastName())) p.add(like(cb, root.get("lastName"), f.getLastName()));
            if (StringUtils.hasText(f.getCourse())) p.add(like(cb, root.get("course"), f.getCourse()));
            if (StringUtils.hasText(f.getGender())) p.add(cb.equal(cb.lower(root.get("gender")), f.getGender().trim().toLowerCase()));
            if (f.getYearOfGraduation() != null) p.add(cb.equal(root.get("yearOfGraduation"), f.getYearOfGraduation()));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
