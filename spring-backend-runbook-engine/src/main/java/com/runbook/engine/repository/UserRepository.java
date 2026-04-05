package com.runbook.engine.repository;

import com.runbook.engine.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    @Query("""
    SELECT u FROM User u
    LEFT JOIN FETCH u.memberships m
    LEFT JOIN FETCH m.organization
    WHERE u.email = :email
""")
    Optional<User> findWithMembershipsByEmail(String email);

}
