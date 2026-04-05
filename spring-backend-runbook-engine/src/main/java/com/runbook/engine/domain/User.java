package com.runbook.engine.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;
    private String image;

    private String provider;
    private String providerId;

    private Instant createdAt;
    private Instant updatedAt;

    // 🔥 Add relationship to organization memberships
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<OrganizationMember> memberships;
}
