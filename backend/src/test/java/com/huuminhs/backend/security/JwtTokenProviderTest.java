package com.huuminhs.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class JwtTokenProviderTest {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    public void testGenerateAndValidateToken() {
        // Create a test user
        User user = new User("testuser", "password", 
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
        
        // Create authentication object
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities());
        
        // Generate token
        String token = jwtTokenProvider.generateToken(authentication);
        
        // Token should not be null or empty
        assertNotNull(token);
        assertFalse(token.isEmpty());
        
        System.out.println("[DEBUG_LOG] Generated token: " + token);
        
        // Validate token
        boolean isValid = jwtTokenProvider.validateToken(token);
        assertTrue(isValid, "Token should be valid");
        
        // Get authentication from token
        Authentication resultAuth = jwtTokenProvider.getAuthentication(token);
        assertNotNull(resultAuth);
        
        // Check username
        User resultUser = (User) resultAuth.getPrincipal();
        assertEquals("testuser", resultUser.getUsername());
        
        // Check authorities
        assertEquals(1, resultUser.getAuthorities().size());
        assertTrue(resultUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
    }
}