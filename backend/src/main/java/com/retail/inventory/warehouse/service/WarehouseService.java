package com.retail.inventory.warehouse.service;

import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.warehouse.dto.WarehouseDto;
import com.retail.inventory.warehouse.dto.WarehouseRequest;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
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
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<WarehouseDto> getWarehouses(WarehouseStatus status, String search) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;

        Specification<Warehouse> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (cleanSearch != null) {
                String pattern = "%" + cleanSearch + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate cityLike = cb.like(cb.lower(root.get("city")), pattern);
                Predicate managerLike = cb.like(cb.lower(root.get("managerName")), pattern);
                predicates.add(cb.or(nameLike, cityLike, managerLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Warehouse> list = warehouseRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "name"));
        return list.stream().map(WarehouseDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public WarehouseDto getWarehouseById(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", id));
        return WarehouseDto.fromEntity(warehouse);
    }

    @Transactional
    public WarehouseDto createWarehouse(WarehouseRequest request, String performedBy) {
        String trimmedName = request.getName().trim();

        if (warehouseRepository.existsByName(trimmedName)) {
            throw new ValidationException("A warehouse with the name '" + trimmedName + "' already exists.");
        }

        Warehouse warehouse = Warehouse.builder()
                .name(trimmedName)
                .address(request.getAddress().trim())
                .city(request.getCity().trim())
                .capacity(request.getCapacity())
                .managerName(request.getManagerName() != null ? request.getManagerName().trim() : null)
                .status(request.getStatus() != null ? request.getStatus() : WarehouseStatus.ACTIVE)
                .build();

        Warehouse saved = warehouseRepository.save(warehouse);

        auditLogRepository.save(AuditLog.builder()
                .action("WAREHOUSE_CREATED")
                .entityName("Warehouse")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Created warehouse '%s' in %s (Capacity: %d, Manager: %s)",
                        saved.getName(), saved.getCity(), saved.getCapacity(),
                        saved.getManagerName() != null ? saved.getManagerName() : "N/A"))
                .build());

        log.info("Warehouse '{}' (ID: {}) created by '{}'", saved.getName(), saved.getId(), performedBy);
        return WarehouseDto.fromEntity(saved);
    }

    @Transactional
    public WarehouseDto updateWarehouse(Long id, WarehouseRequest request, String performedBy) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", id));

        String trimmedName = request.getName().trim();
        if (warehouseRepository.existsByNameAndIdNot(trimmedName, id)) {
            throw new ValidationException("Another warehouse with the name '" + trimmedName + "' already exists.");
        }

        warehouse.setName(trimmedName);
        warehouse.setAddress(request.getAddress().trim());
        warehouse.setCity(request.getCity().trim());
        warehouse.setCapacity(request.getCapacity());
        warehouse.setManagerName(request.getManagerName() != null ? request.getManagerName().trim() : null);
        if (request.getStatus() != null) {
            warehouse.setStatus(request.getStatus());
        }

        Warehouse updated = warehouseRepository.save(warehouse);

        auditLogRepository.save(AuditLog.builder()
                .action("WAREHOUSE_UPDATED")
                .entityName("Warehouse")
                .entityId(updated.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Updated warehouse '%s' details (City: %s, Capacity: %d)",
                        updated.getName(), updated.getCity(), updated.getCapacity()))
                .build());

        log.info("Warehouse '{}' (ID: {}) updated by '{}'", updated.getName(), id, performedBy);
        return WarehouseDto.fromEntity(updated);
    }

    @Transactional
    public WarehouseDto updateWarehouseStatus(Long id, WarehouseStatus newStatus, String performedBy) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", id));

        WarehouseStatus oldStatus = warehouse.getStatus();
        if (newStatus != null) {
            warehouse.setStatus(newStatus);
        } else {
            // If null, toggle
            warehouse.setStatus(oldStatus == WarehouseStatus.ACTIVE ? WarehouseStatus.INACTIVE : WarehouseStatus.ACTIVE);
        }

        Warehouse saved = warehouseRepository.save(warehouse);

        auditLogRepository.save(AuditLog.builder()
                .action("WAREHOUSE_STATUS_CHANGED")
                .entityName("Warehouse")
                .entityId(id.toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Changed warehouse '%s' status from %s to %s",
                        saved.getName(), oldStatus, saved.getStatus()))
                .build());

        log.info("Warehouse '{}' (ID: {}) status changed to {} by '{}'", saved.getName(), id, saved.getStatus(), performedBy);
        return WarehouseDto.fromEntity(saved);
    }
}
