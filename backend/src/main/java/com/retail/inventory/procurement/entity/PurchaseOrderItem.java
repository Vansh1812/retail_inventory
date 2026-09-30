package com.retail.inventory.procurement.entity;

import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_items", indexes = {
        @Index(name = "idx_po_item_po", columnList = "purchase_order_id"),
        @Index(name = "idx_po_item_product", columnList = "product_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Transient
    public BigDecimal getSubtotal() {
        if (unitCost == null || quantity == null) return BigDecimal.ZERO;
        return unitCost.multiply(BigDecimal.valueOf(quantity));
    }
}
