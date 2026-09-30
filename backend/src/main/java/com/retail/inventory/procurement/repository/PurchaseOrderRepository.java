package com.retail.inventory.procurement.repository;

import com.retail.inventory.procurement.entity.PurchaseOrder;
import com.retail.inventory.procurement.entity.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long>, JpaSpecificationExecutor<PurchaseOrder> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    boolean existsByPoNumber(String poNumber);
    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);
    List<PurchaseOrder> findByCreatedAtBetween(java.time.Instant start, java.time.Instant end);
    List<PurchaseOrder> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);
    Optional<PurchaseOrder> findByIdAndSupplierId(Long id, Long supplierId);
}
