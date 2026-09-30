package com.retail.inventory.warehouse.repository;

import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long>, JpaSpecificationExecutor<Warehouse> {
    Optional<Warehouse> findByName(String name);
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);
    List<Warehouse> findByStatus(WarehouseStatus status);
    long countByStatus(WarehouseStatus status);
}
