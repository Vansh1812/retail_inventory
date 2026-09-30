package com.retail.inventory.inventory.entity;

import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.common.entity.BaseEntity;
import com.retail.inventory.warehouse.entity.Warehouse;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "inventory_transactions", indexes = {
        @Index(name = "idx_inv_tx_product", columnList = "product_id"),
        @Index(name = "idx_inv_tx_warehouse", columnList = "warehouse_id"),
        @Index(name = "idx_inv_tx_type", columnList = "transaction_type"),
        @Index(name = "idx_inv_tx_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "quantity_delta", nullable = false)
    private Integer quantityDelta;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private InventoryTransactionType transactionType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy;

    @Column(name = "reason", length = 255)
    private String reason;

    @Builder.Default
    @Column(nullable = false)
    private Instant timestamp = Instant.now();
}
