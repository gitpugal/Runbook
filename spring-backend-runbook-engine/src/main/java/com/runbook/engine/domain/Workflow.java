package com.runbook.engine.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflows")
@Data
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Workflow {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private WorkflowStatus status;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(columnDefinition = "TEXT")
    private String definition;   // stores nodes + edges JSON

    private Instant updatedAt;


    private Instant createdAt;

    private Boolean scheduled;
    private String cronString;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_database_id")
    private OrgDatabase orgDatabase;

}
