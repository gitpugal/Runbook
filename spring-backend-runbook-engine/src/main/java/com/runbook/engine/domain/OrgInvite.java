package com.runbook.engine.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "org_invites",
        uniqueConstraints = @UniqueConstraint(columnNames = {"organizationId", "email"}))
@Data
public class OrgInvite {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    private OrgRole role;

    private boolean accepted;

    private Instant createdAt;

    @ManyToOne
    @JoinColumn(name = "organizationId")
    private Organization organization;

    @ManyToOne
    @JoinColumn(name = "invitedById")
    private User invitedBy;
}
