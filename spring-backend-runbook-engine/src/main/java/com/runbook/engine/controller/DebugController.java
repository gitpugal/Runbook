package com.runbook.engine.controller;

import com.runbook.engine.domain.Organization;
import com.runbook.engine.repository.OrganizationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/debug")
public class DebugController {

    private final OrganizationRepository orgRepo;

    public DebugController(OrganizationRepository orgRepo) {
        this.orgRepo = orgRepo;
    }

    @GetMapping("/orgs")
    public List<Organization> getOrgs() {
        return orgRepo.findAll();
    }
}
