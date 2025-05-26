package com.huuminhs.backend.controller;

import com.huuminhs.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class PublishControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    public void testGetToken() throws Exception {
        int streamNumber = 123;

        MvcResult result = mockMvc.perform(get("/api/publish/token/" + streamNumber))
                .andExpect(status().isOk())
                .andReturn();

        String token = result.getResponse().getContentAsString();

        // Verify token is not null or empty
        assertNotNull(token);
        assertTrue(token.length() > 0);

        // Verify token format (should be a JWT token with 3 parts separated by dots)
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length);
    }

    @Test
    public void testGetJwks() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/publish/jwks"))
                .andExpect(status().isOk())
                .andReturn();

        String jwks = result.getResponse().getContentAsString();

        // Verify JWKS is not null or empty
        assertNotNull(jwks);
        assertTrue(jwks.length() > 0);

        // Verify JWKS contains expected fields
        assertTrue(jwks.contains("keys"));
        assertTrue(jwks.contains("mediamtx-key"));
        assertTrue(jwks.contains("RSA"));
    }
}
