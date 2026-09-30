package com.retail.inventory.admin.controller;

import com.retail.inventory.admin.dto.UpdateRolesRequest;
import com.retail.inventory.admin.dto.UserResponseDto;
import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.service.AdminService;
import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponseDto>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponseDto> users = adminService.getUsers(pageable, search);
        return ResponseEntity.ok(ApiResponse.success(users, "Users fetched successfully"));
    }

    @PutMapping("/users/{id}/roles")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRolesRequest request,
            @AuthenticationPrincipal UserDetailsImpl adminPrincipal
    ) {
        String adminUsername = adminPrincipal != null ? adminPrincipal.getUsername() : "ADMIN";
        UserResponseDto updatedUser = adminService.updateUserRoles(id, request.getRoles(), adminUsername);
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "User roles updated successfully"));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserResponseDto>> toggleUserStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl adminPrincipal
    ) {
        String adminUsername = adminPrincipal != null ? adminPrincipal.getUsername() : "ADMIN";
        UserResponseDto updatedUser = adminService.toggleUserStatus(id, adminUsername);
        String statusStr = updatedUser.isActive() ? "activated" : "deactivated";
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "User successfully " + statusStr));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> auditLogs = adminService.getAuditLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(auditLogs, "Audit activity logs fetched successfully"));
    }
}
