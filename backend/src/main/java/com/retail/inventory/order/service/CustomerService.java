package com.retail.inventory.order.service;

import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.order.dto.CustomerDto;
import com.retail.inventory.order.dto.CustomerRequest;
import com.retail.inventory.order.entity.Customer;
import com.retail.inventory.order.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public Page<CustomerDto> getCustomers(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            String query = search.trim();
            return customerRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable)
                    .map(this::mapToDto);
        }
        return customerRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        return customerRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    @Transactional
    public CustomerDto createCustomer(CustomerRequest request, String username) {
        if (customerRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new ValidationException("Customer with email '" + request.getEmail() + "' already exists");
        }

        Customer customer = Customer.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .build();

        Customer saved = customerRepository.save(customer);

        auditLogRepository.save(AuditLog.builder()
                .action("CREATE_CUSTOMER")
                .entityName("Customer")
                .entityId(saved.getId().toString())
                .performedBy(username != null ? username : "SYSTEM")
                .details("Created customer: " + saved.getName() + " (" + saved.getEmail() + ")")
                .timestamp(Instant.now())
                .build());

        log.info("Customer created with ID {}: {} by user {}", saved.getId(), saved.getName(), username);
        return mapToDto(saved);
    }

    @Transactional
    public CustomerDto updateCustomer(Long id, CustomerRequest request, String username) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        String newEmail = request.getEmail().trim().toLowerCase();
        if (!customer.getEmail().equalsIgnoreCase(newEmail) && customerRepository.existsByEmail(newEmail)) {
            throw new ValidationException("Customer with email '" + request.getEmail() + "' already exists");
        }

        customer.setName(request.getName().trim());
        customer.setEmail(newEmail);
        customer.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        customer.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);

        Customer updated = customerRepository.save(customer);

        auditLogRepository.save(AuditLog.builder()
                .action("UPDATE_CUSTOMER")
                .entityName("Customer")
                .entityId(updated.getId().toString())
                .performedBy(username != null ? username : "SYSTEM")
                .details("Updated customer details for: " + updated.getName())
                .timestamp(Instant.now())
                .build());

        return mapToDto(updated);
    }

    public CustomerDto mapToDto(Customer customer) {
        if (customer == null) return null;
        return CustomerDto.builder()
                .id(customer.getId())
                .name(customer.getName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}
