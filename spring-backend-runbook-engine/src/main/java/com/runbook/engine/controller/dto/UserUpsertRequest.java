package com.runbook.engine.controller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpsertRequest {

    @Email
    @NotBlank
    private String email;

    private String name;
    private String image;

    @NotBlank
    private String provider;

    @NotBlank
    private String providerId;
}
