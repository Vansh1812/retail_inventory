package com.retail.inventory.procurement.repository;

import com.retail.inventory.procurement.entity.Supplier;
import com.retail.inventory.procurement.entity.SupplierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long>, JpaSpecificationExecutor<Supplier> {
    Optional<Supplier> findByName(String name);
    Optional<Supplier> findByEmail(String email);
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);
    List<Supplier> findByStatus(SupplierStatus status);
}
