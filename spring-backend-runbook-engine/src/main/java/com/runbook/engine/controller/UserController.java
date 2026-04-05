package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.OrganizationWithUserRole;
import com.runbook.engine.controller.dto.UserUpsertRequest;
import com.runbook.engine.domain.Organization;
import com.runbook.engine.domain.User;
import com.runbook.engine.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<User> createOrUpdateUser(@Valid @RequestBody UserUpsertRequest request) {
        User user = userService.upsertUser(
                request.getEmail(),
                request.getName(),
                request.getImage(),
                request.getProvider(),
                request.getProviderId()
        );
        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<User> getUser(@RequestParam("email") String email){
        return  ResponseEntity.ok(userService.getOrThrow(email));
    }

    @GetMapping("/orgs")
    public ResponseEntity<List<OrganizationWithUserRole>> getUserOrganizations(@RequestParam("email") String email){
        return  ResponseEntity.ok(userService.getUserOrganizations(email));
    }
}
