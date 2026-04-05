package com.runbook.engine.service;

import com.runbook.engine.controller.dto.OrganizationWithUserRole;
import com.runbook.engine.domain.Organization;
import com.runbook.engine.domain.User;
import com.runbook.engine.repository.OrganizationRepository;
import com.runbook.engine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepo;
    private final OrganizationRepository organizationRepository;

    public User upsertUser(String email, String name, String image, String provider, String providerId) {
        return userRepo.findByEmail(email)
                .map(existing -> {
                    existing.setName(name);
                    existing.setImage(image);
                    existing.setProvider(provider);
                    existing.setProviderId(providerId);
                    existing.setUpdatedAt(Instant.now());
                    return userRepo.save(existing);
                })
                .orElseGet(() -> userRepo.save(
                        User.builder()
                                .id(UUID.randomUUID())
                                .email(email)
                                .name(name)
                                .image(image)
                                .provider(provider)
                                .providerId(providerId)
                                .createdAt(Instant.now())
                                .updatedAt(Instant.now())
                                .build()
                ));
    }

    public List<OrganizationWithUserRole> getUserOrganizations(String email) {
        return organizationRepository.findOrganizationsByUserEmail(email);
    }
    public User getOrThrow(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
