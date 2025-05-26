package com.huuminhs.backend.controller;

import com.huuminhs.backend.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/publish")
public class PublishController {

    private final JwtTokenProvider jwtTokenProvider;

    public PublishController(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Generates a JWT token with MediaMTX permissions for the specified stream number.
     *
     * @param number The stream number to include in the permissions
     * @return The generated JWT token
     */
    @GetMapping("/token/{number}")
    public ResponseEntity<String> getToken(@PathVariable("number") int number) {
        String token = jwtTokenProvider.generateMediaMtxToken(number);
        return ResponseEntity.ok(token);
    }

    /**
     * Returns the JWKS (JSON Web Key Set) containing the public key for MediaMTX tokens.
     *
     * @return The JWKS as a JSON string
     */
    @GetMapping("/jwks")
    public ResponseEntity<String> getJwks() {
        String jwks = jwtTokenProvider.getJwks();
        return ResponseEntity.ok(jwks);
    }
}