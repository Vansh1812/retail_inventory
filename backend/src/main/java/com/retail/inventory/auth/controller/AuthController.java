package com.retail.inventory.auth.controller;

import com.retail.inventory.auth.dto.JwtResponse;
import com.retail.inventory.auth.dto.LoginRequest;
import com.retail.inventory.auth.dto.RegisterCustomerRequest;
import com.retail.inventory.auth.dto.RegisterRequest;
import com.retail.inventory.auth.entity.Role;
import com.retail.inventory.auth.entity.RoleType;
import com.retail.inventory.auth.entity.User;
import com.retail.inventory.auth.repository.RoleRepository;
import com.retail.inventory.auth.repository.UserRepository;
import com.retail.inventory.auth.security.jwt.JwtUtils;
import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.order.entity.Customer;
import com.retail.inventory.order.repository.CustomerRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerRepository customerRepository;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Authentication attempt for user: {}", loginRequest.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        JwtResponse jwtResponse = JwtResponse.builder()
                .token(jwt)
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .roles(roles)
                .customerId(userDetails.getCustomerId())
                .supplierId(userDetails.getSupplierId())
                .build();

        return ResponseEntity.ok(ApiResponse.success(jwtResponse, "Authentication successful"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<JwtResponse>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Registration attempt for username: {}, email: {}", registerRequest.getUsername(), registerRequest.getEmail());

        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Username '" + registerRequest.getUsername() + "' is already in use. Please choose another."));
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Email '" + registerRequest.getEmail() + "' is already registered. Please sign in or use another email."));
        }

        // Determine user role
        RoleType roleType = RoleType.INVENTORY_MANAGER;
        if (registerRequest.getRole() != null) {
            try {
                String cleanRole = registerRequest.getRole().toUpperCase().replace("ROLE_", "");
                roleType = RoleType.valueOf(cleanRole);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role '{}' requested, falling back to INVENTORY_MANAGER", registerRequest.getRole());
            }
        }

        Role userRole = roleRepository.findByName(roleType)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleType.INVENTORY_MANAGER)
                        .description("Default inventory manager role")
                        .build()));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User newUser = User.builder()
                .username(registerRequest.getUsername().trim())
                .email(registerRequest.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .isActive(true)
                .roles(roles)
                .build();

        userRepository.save(newUser);
        log.info("User registered successfully: id={}, username={}", newUser.getId(), newUser.getUsername());

        // Immediately authenticate the newly registered user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getUsername(),
                        registerRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roleNames = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        JwtResponse jwtResponse = JwtResponse.builder()
                .token(jwt)
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .roles(roleNames)
                .build();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(jwtResponse, "Account registered and signed in successfully"));
    }

    @PostMapping("/register-customer")
    public ResponseEntity<ApiResponse<JwtResponse>> registerCustomer(@Valid @RequestBody RegisterCustomerRequest request) {
        log.info("Customer registration attempt for username: {}, email: {}", request.getUsername(), request.getEmail());

        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Username '" + request.getUsername() + "' is already in use. Please choose another."));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Email '" + request.getEmail() + "' is already registered. Please sign in or use another email."));
        }

        Role customerRole = roleRepository.findByName(RoleType.CUSTOMER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleType.CUSTOMER)
                        .description("Customer portal self-service access")
                        .build()));

        Customer customer = customerRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseGet(() -> customerRepository.save(Customer.builder()
                        .name(request.getName().trim())
                        .email(request.getEmail().trim().toLowerCase())
                        .phone(request.getPhone())
                        .address(request.getAddress())
                        .build()));

        Set<Role> roles = new HashSet<>();
        roles.add(customerRole);

        User newUser = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getName().trim())
                .isActive(true)
                .roles(roles)
                .customer(customer)
                .build();

        userRepository.save(newUser);
        log.info("Customer registered successfully: id={}, username={}, customerId={}", newUser.getId(), newUser.getUsername(), customer.getId());

        // Immediately authenticate
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roleNames = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        JwtResponse jwtResponse = JwtResponse.builder()
                .token(jwt)
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .roles(roleNames)
                .customerId(customer.getId())
                .build();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(jwtResponse, "Customer account created and signed in successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<JwtResponse>> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
        }

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        JwtResponse response = JwtResponse.builder()
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .roles(roles)
                .customerId(userDetails.getCustomerId())
                .supplierId(userDetails.getSupplierId())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Current user profile fetched successfully"));
    }
}
