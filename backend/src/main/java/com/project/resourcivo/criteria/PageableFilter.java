package com.project.resourcivo.criteria;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Optional paging and sorting for every search endpoint. Leave {@code size} empty for "everything".
 * Example body: {"name":"physics","page":0,"size":20,"sortBy":"name","direction":"asc"}
 */
public class PageableFilter {

    private Integer page;
    private Integer size;
    private String sortBy;
    private String direction;

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public Pageable paging() {
        Sort sort = Sort.unsorted();
        // plain attribute names only, so a client cannot inject arbitrary property paths
        if (sortBy != null && sortBy.matches("[A-Za-z0-9_]+")) {
            sort = Sort.by("desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        }
        if (size == null || size < 1) {
            return Pageable.unpaged(sort);
        }
        return PageRequest.of(Math.max(page == null ? 0 : page, 0), Math.min(size, 200), sort);
    }
}
