package com.retail.inventory.admin.service;

import com.retail.inventory.admin.dto.UserResponseDto;
import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.auth.entity.Role;
import com.retail.inventory.auth.entity.RoleType;
import com.retail.inventory.auth.entity.User;
import com.retail.inventory.auth.repository.RoleRepository;
import com.retail.inventory.auth.repository.UserRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public Page<UserResponseDto> getUsers(Pageable pageable, String search) {
        Page<User> userPage;
        if (search != null && !search.trim().isEmpty()) {
            String query = search.trim().toLowerCase();
            List<User> filtered = userRepository.findAll().stream()
                    .filter(u -> u.getUsername().toLowerCase().contains(query)
                            || u.getEmail().toLowerCase().contains(query)
                            || (u.getFirstName() != null && u.getFirstName().toLowerCase().contains(query))
                            || (u.getLastName() != null && u.getLastName().toLowerCase().contains(query)))
                    .collect(Collectors.toList());

            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filtered.size());
            List<UserResponseDto> dtoList = (start > filtered.size())
                    ? List.of()
                    : filtered.subList(start, end).stream().map(UserResponseDto::fromEntity).collect(Collectors.toList());

            return new PageImpl<>(dtoList, pageable, filtered.size());
        } else {
            userPage = userRepository.findAll(pageable);
            return userPage.map(UserResponseDto::fromEntity);
        }
    }

    @Transactional
    public UserResponseDto updateUserRoles(Long userId, Set<String> requestedRoles, String performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean hadAdminRole = user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleType.ADMIN);

        // Normalize requested roles
        Set<RoleType> targetRoleTypes = new HashSet<>();
        for (String roleStr : requestedRoles) {
            String clean = roleStr.toUpperCase().replace("ROLE_", "");
            try {
                targetRoleTypes.add(RoleType.valueOf(clean));
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Unknown system role: " + roleStr);
            }
        }

        boolean willHaveAdminRole = targetRoleTypes.contains(RoleType.ADMIN);

        // Safety enforcement: cannot remove ADMIN role from the last active admin
        if (hadAdminRole && !willHaveAdminRole) {
            long activeAdminCount = countActiveAdmins();
            if (activeAdminCount <= 1) {
                throw new ValidationException("Cannot remove the ADMIN role from the last active administrator.");
            }
        }

        // Fetch corresponding entity roles
        Set<Role> resolvedRoles = new HashSet<>();
        for (RoleType rt : targetRoleTypes) {
            Role role = roleRepository.findByName(rt)
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name(rt)
                            .description("System role " + rt.name())
                            .build()));
            resolvedRoles.add(role);
        }

        user.setRoles(resolvedRoles);
        User updatedUser = userRepository.save(user);

        // Record Audit Log
        String roleNamesStr = resolvedRoles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", "));
        recordAuditLog(
                "USER_ROLES_UPDATED",
                "User",
                userId.toString(),
                performedBy,
                String.format("Assigned roles [%s] to user '%s'", roleNamesStr, user.getUsername())
        );

        log.info("Admin '{}' updated roles for user '{}' to [{}]", performedBy, user.getUsername(), roleNamesStr);
        return UserResponseDto.fromEntity(updatedUser);
    }

    @Transactional
    public UserResponseDto toggleUserStatus(Long userId, String performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean willDeactivate = Boolean.TRUE.equals(user.getIsActive());

        // Safety enforcement: cannot deactivate the last active admin
        if (willDeactivate && user.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ADMIN)) {
            long activeAdminCount = countActiveAdmins();
            if (activeAdminCount <= 1) {
                throw new ValidationException("Cannot deactivate the last remaining active administrator account.");
            }
        }

        user.setIsActive(!willDeactivate);
        User savedUser = userRepository.save(user);

        String action = user.getIsActive() ? "USER_ACTIVATED" : "USER_DEACTIVATED";
        recordAuditLog(
                action,
                "User",
                userId.toString(),
                performedBy,
                String.format("User '%s' status toggled to %s", user.getUsername(), user.getIsActive() ? "ACTIVE" : "INACTIVE")
        );

        log.info("Admin '{}' changed user '{}' status to {}", performedBy, user.getUsername(), user.getIsActive());
        return UserResponseDto.fromEntity(savedUser);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public void recordAuditLog(String action, String entityName, String entityId, String performedBy, String details) {
        AuditLog logEntry = AuditLog.builder()
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(details)
                .timestamp(Instant.now())
                .build();
        auditLogRepository.save(logEntry);
    }

    private long countActiveAdmins() {
        return userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive())
                        && u.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ADMIN))
                .count();
    }
}
