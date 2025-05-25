package com.huuminhs.backend.controller;

import com.huuminhs.backend.dto.LoginRequest;
import com.huuminhs.backend.dto.LoginResponse;
import com.huuminhs.backend.dto.RegisterRequest;
import com.huuminhs.backend.dto.RegisterResponse;
import com.huuminhs.backend.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Controller: Login attempt for user: {}", loginRequest.getUsername());
        LoginResponse response = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Controller: Registration attempt for username: {}", registerRequest.getUsername());
        RegisterResponse response = authService.registerUser(registerRequest);
        return ResponseEntity.ok(response);
    }
}