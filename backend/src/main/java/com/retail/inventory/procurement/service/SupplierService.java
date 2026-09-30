package com.retail.inventory.procurement.service;

import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.procurement.dto.SupplierDto;
import com.retail.inventory.procurement.dto.SupplierRequest;
import com.retail.inventory.procurement.entity.Supplier;
import com.retail.inventory.procurement.entity.SupplierStatus;
import com.retail.inventory.procurement.repository.SupplierRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<SupplierDto> getSuppliers(SupplierStatus status, String search) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;

        Specification<Supplier> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (cleanSearch != null) {
                String pattern = "%" + cleanSearch + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate contactLike = cb.like(cb.lower(root.get("contactPerson")), pattern);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(nameLike, contactLike, emailLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return supplierRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "name"))
                .stream().map(SupplierDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public SupplierDto getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return SupplierDto.fromEntity(supplier);
    }

    @Transactional
    public SupplierDto createSupplier(SupplierRequest request, String performedBy) {
        String trimmedName = request.getName().trim();

        if (supplierRepository.existsByName(trimmedName)) {
            throw new ValidationException("A supplier with name '" + trimmedName + "' already exists.");
        }

        Supplier supplier = Supplier.builder()
                .name(trimmedName)
                .contactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .status(request.getStatus() != null ? request.getStatus() : SupplierStatus.ACTIVE)
                .build();

        Supplier saved = supplierRepository.save(supplier);

        auditLogRepository.save(AuditLog.builder()
                .action("SUPPLIER_CREATED")
                .entityName("Supplier")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Registered vendor '%s' (Contact: %s)", saved.getName(), saved.getContactPerson()))
                .build());

        log.info("Supplier '{}' registered by '{}'", saved.getName(), performedBy);
        return SupplierDto.fromEntity(saved);
    }

    @Transactional
    public SupplierDto updateSupplier(Long id, SupplierRequest request, String performedBy) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        String trimmedName = request.getName().trim();
        if (supplierRepository.existsByNameAndIdNot(trimmedName, id)) {
            throw new ValidationException("Another supplier with name '" + trimmedName + "' already exists.");
        }

        supplier.setName(trimmedName);
        supplier.setContactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null);
        supplier.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        supplier.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        supplier.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        if (request.getStatus() != null) {
            supplier.setStatus(request.getStatus());
        }

        Supplier updated = supplierRepository.save(supplier);

        auditLogRepository.save(AuditLog.builder()
                .action("SUPPLIER_UPDATED")
                .entityName("Supplier")
                .entityId(updated.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Updated vendor details for '%s'", updated.getName()))
                .build());

        log.info("Supplier '{}' updated by '{}'", updated.getName(), performedBy);
        return SupplierDto.fromEntity(updated);
    }

    @Transactional
    public SupplierDto toggleSupplierStatus(Long id, String performedBy) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        SupplierStatus nextStatus = supplier.getStatus() == SupplierStatus.ACTIVE ? SupplierStatus.INACTIVE : SupplierStatus.ACTIVE;
        supplier.setStatus(nextStatus);
        Supplier saved = supplierRepository.save(supplier);

        auditLogRepository.save(AuditLog.builder()
                .action("SUPPLIER_STATUS_CHANGED")
                .entityName("Supplier")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Changed supplier '%s' status to %s", saved.getName(), nextStatus))
                .build());

        return SupplierDto.fromEntity(saved);
    }
}
