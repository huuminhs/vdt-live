package com.huuminhs.backend.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.text.ParseException;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    private RSAKey rsaKey;
    private RSAPublicKey publicKey;
    private RSAPrivateKey privateKey;

    // Separate key pair for MediaMTX tokens
    private RSAKey mediaMtxRsaKey;
    private RSAPublicKey mediaMtxPublicKey;
    private RSAPrivateKey mediaMtxPrivateKey;

    public JwtTokenProvider() throws JOSEException {
        // Generate RSA key pair for RS256 signature (authentication)
        this.rsaKey = new RSAKeyGenerator(2048)
                .keyID("vdt-live-key")
                .generate();
        this.publicKey = rsaKey.toRSAPublicKey();
        this.privateKey = rsaKey.toRSAPrivateKey();

        // Generate separate RSA key pair for MediaMTX tokens
        this.mediaMtxRsaKey = new RSAKeyGenerator(2048)
                .keyID("mediamtx-key")
                .generate();
        this.mediaMtxPublicKey = mediaMtxRsaKey.toRSAPublicKey();
        this.mediaMtxPrivateKey = mediaMtxRsaKey.toRSAPrivateKey();
    }

    public String generateToken(Authentication authentication) {
        User principal = (User) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        List<String> authorities = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        try {
            // Create RSA signer with the private key
            JWSSigner signer = new RSASSASigner(privateKey);

            // Prepare JWT with claims set
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(principal.getUsername())
                    .claim("roles", authorities)
                    .issueTime(now)
                    .expirationTime(expiryDate)
                    .build();

            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claimsSet);

            // Apply the RSA signature
            signedJWT.sign(signer);

            // Serialize to compact form
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error generating JWT token", e);
        }
    }

    public Authentication getAuthentication(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            String username = claims.getSubject();
            List<?> rolesList = claims.getClaim("roles") != null ? (List<?>) claims.getClaim("roles") : Collections.emptyList();

            Collection<SimpleGrantedAuthority> authorities = rolesList.stream()
                    .map(role -> new SimpleGrantedAuthority(role.toString()))
                    .collect(Collectors.toList());

            User principal = new User(username, "", authorities);

            return new UsernamePasswordAuthenticationToken(principal, token, authorities);
        } catch (ParseException e) {
            throw new RuntimeException("Failed to parse JWT token", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            JWSVerifier verifier = new RSASSAVerifier(publicKey);
            boolean isSignatureValid = signedJWT.verify(verifier);

            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            boolean isTokenExpired = expirationTime != null && expirationTime.before(new Date());

            return isSignatureValid && !isTokenExpired;
        } catch (ParseException | JOSEException e) {
            return false;
        }
    }

    /**
     * Generates a JWT token with MediaMTX permissions for the specified stream number.
     * 
     * @param streamNumber The stream number to include in the permissions
     * @return The generated JWT token
     */
    public String generateMediaMtxToken(int streamNumber) {
        try {
            // Create RSA signer with the MediaMTX private key
            JWSSigner signer = new RSASSASigner(mediaMtxPrivateKey);

            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

            // Create the permission object
            Map<String, Object> permission = new HashMap<>();
            permission.put("action", "publish");
            permission.put("path", "stream/" + streamNumber);

            List<Map<String, Object>> permissions = Collections.singletonList(permission);

            // Prepare JWT with claims set
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .claim("mediamtx_permissions", permissions)
                    .issueTime(now)
                    .expirationTime(expiryDate)
                    .build();

            // Create header with algorithm, type and key ID
            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .type(JOSEObjectType.JWT)
                    .keyID(mediaMtxRsaKey.getKeyID())
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, claimsSet);

            // Apply the RSA signature
            signedJWT.sign(signer);

            // Serialize to compact form
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error generating MediaMTX JWT token", e);
        }
    }

    /**
     * Returns the JWKS (JSON Web Key Set) containing the public key for MediaMTX tokens.
     * 
     * @return The JWKS as a JSON string
     */
    public String getJwks() {
        try {
            JWKSet jwkSet = new JWKSet(mediaMtxRsaKey.toPublicJWK());
            return jwkSet.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating JWKS", e);
        }
    }
}
