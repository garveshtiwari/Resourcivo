package com.project.resourcivo.specification;

import com.project.resourcivo.criteria.LibraryBookFilterDTO;
import com.project.resourcivo.model.LibraryBook;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class LibraryBookSpecification {

    private static Predicate like(jakarta.persistence.criteria.CriteriaBuilder cb, jakarta.persistence.criteria.Expression<String> path, String value) {
        return cb.like(cb.lower(path), "%" + value.trim().toLowerCase() + "%");
    }

    public static Specification<LibraryBook> build(LibraryBookFilterDTO f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f == null) {
                return cb.conjunction();
            }
            if (StringUtils.hasText(f.getName())) p.add(like(cb, root.get("name"), f.getName()));
            if (StringUtils.hasText(f.getAuthor())) p.add(like(cb, root.get("author"), f.getAuthor()));
            if (StringUtils.hasText(f.getCategory())) p.add(like(cb, root.get("category"), f.getCategory()));
            if (f.getIsIssued() != null) p.add(cb.equal(root.get("isIssued"), f.getIsIssued()));
            if (f.getLibraryId() != null) p.add(cb.equal(root.get("library").get("id"), f.getLibraryId()));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
