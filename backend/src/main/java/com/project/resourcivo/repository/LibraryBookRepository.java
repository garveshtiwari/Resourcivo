package com.project.resourcivo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.resourcivo.model.LibraryBook;

@Repository
public interface LibraryBookRepository extends JpaRepository<LibraryBook, Long>, JpaSpecificationExecutor<LibraryBook> {
	boolean existsByLibraryId(Long libraryId);

	long countByIsIssued(Boolean isIssued);

	@org.springframework.data.jpa.repository.Query("select distinct b.category from LibraryBook b where b.category is not null and b.category <> '' order by b.category")
	java.util.List<String> findDistinctCategories();

}
