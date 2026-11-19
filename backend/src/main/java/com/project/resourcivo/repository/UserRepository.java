package com.project.resourcivo.repository;

import com.project.resourcivo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    /** Ids of enabled accounts holding the given role (used to address notifications). */
    @org.springframework.data.jpa.repository.Query(
            "select distinct u.id from User u join u.roles r where r.name = :role and u.enabled = true")
    java.util.List<Long> findEnabledIdsByRole(@org.springframework.data.repository.query.Param("role") com.project.resourcivo.model.Role.RoleName role);
}
