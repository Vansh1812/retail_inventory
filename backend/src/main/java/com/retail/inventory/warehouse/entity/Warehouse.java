package com.retail.inventory.warehouse.entity;

import com.retail.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "warehouses", indexes = {
        @Index(name = "idx_warehouses_name", columnList = "name"),
        @Index(name = "idx_warehouses_city", columnList = "city"),
        @Index(name = "idx_warehouses_status", columnList = "status")
}, uniqueConstraints = {
        @UniqueConstraint(columnNames = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warehouse extends BaseEntity {

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "manager_name", length = 100)
    private String managerName;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WarehouseStatus status = WarehouseStatus.ACTIVE;
}
