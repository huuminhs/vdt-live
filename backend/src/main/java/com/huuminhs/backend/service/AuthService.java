package com.huuminhs.backend.service;

import com.huuminhs.backend.dto.LoginRequest;
import com.huuminhs.backend.dto.LoginResponse;
import com.huuminhs.backend.dto.RegisterRequest;
import com.huuminhs.backend.dto.RegisterResponse;
import com.huuminhs.backend.exception.DuplicateUsernameException;
import com.huuminhs.backend.model.User;
import com.huuminhs.backend.repository.UserRepository;
import com.huuminhs.backend.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse authenticateUser(LoginRequest loginRequest) {
        log.info("Login attempt for user: {}", loginRequest.getUsername());

        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword()
            )
        );

        // Set authentication in security context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generate JWT token
        String jwt = tokenProvider.generateToken(authentication);

        log.info("User logged in successfully: {}", loginRequest.getUsername());
        // Return token in response
        return new LoginResponse(jwt, loginRequest.getUsername());
    }

    public RegisterResponse registerUser(RegisterRequest registerRequest) {
        log.info("Registration attempt for username: {}", registerRequest.getUsername());

        // Check if username already exists
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            log.warn("Registration failed: Username '{}' already exists", registerRequest.getUsername());
            throw new DuplicateUsernameException(registerRequest.getUsername());
        }

        // Create new user
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        // Save user to database
        userRepository.save(user);

        log.info("User registered successfully: {}", registerRequest.getUsername());

        // Return success response
        return new RegisterResponse(
            registerRequest.getUsername(),
            "User registered successfully"
        );
    }
}
