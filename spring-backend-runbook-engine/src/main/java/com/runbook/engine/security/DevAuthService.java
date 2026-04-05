package com.runbook.engine.security;

import com.runbook.engine.domain.User;
import com.runbook.engine.service.UserService;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
public class DevAuthService {

    private final UserService userService;
    private User cachedUser;

    public DevAuthService(UserService userService) {
        this.userService = userService;
    }

    public User getUser(String emailHeader) {
        if (cachedUser == null) {
            cachedUser = userService.getOrThrow(emailHeader);
        }
        return cachedUser;
    }
}
