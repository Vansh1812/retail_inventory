package com.retail.inventory.auth.init;

import com.retail.inventory.auth.entity.Role;
import com.retail.inventory.auth.entity.RoleType;
import com.retail.inventory.auth.entity.User;
import com.retail.inventory.auth.repository.RoleRepository;
import com.retail.inventory.auth.repository.UserRepository;
import com.retail.inventory.catalog.entity.Category;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.entity.ProductStatus;
import com.retail.inventory.catalog.repository.CategoryRepository;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.entity.InventoryTransaction;
import com.retail.inventory.inventory.entity.InventoryTransactionType;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.inventory.repository.InventoryTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import com.retail.inventory.procurement.entity.*;
import com.retail.inventory.procurement.repository.PurchaseOrderRepository;
import com.retail.inventory.procurement.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final com.retail.inventory.order.repository.CustomerRepository customerRepository;
    private final com.retail.inventory.order.repository.OrderRepository orderRepository;
    private final com.retail.inventory.order.repository.ShipmentRepository shipmentRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Removing legacy enum check constraints for updated roles and statuses...");
        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS roles DROP CONSTRAINT IF EXISTS roles_name_check");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS customer_orders DROP CONSTRAINT IF EXISTS customer_orders_status_check");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS customer_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS supplier_id BIGINT");
        } catch (Exception e) {
            log.warn("Database schema update notice: {}", e.getMessage());
        }

        seedDatabase();
    }

    @Transactional
    public void seedDatabase() {
        log.info("Initializing baseline roles and default administration account...");

        Map<RoleType, Role> roleMap = seedRoles();
        seedDefaultAdmin(roleMap);
        seedRoleDemoUsers(roleMap);
        seedCatalog();
        seedWarehouses();
        seedInventory();
        seedProcurement();
        seedOrders();
        cleanUpDemoAccountsForProduction();

        log.info("Database security, catalog, warehouse, inventory, procurement & order management initialization completed successfully.");
    }

    private Map<RoleType, Role> seedRoles() {
        Map<RoleType, Role> roles = new EnumMap<>(RoleType.class);

        Map<RoleType, String> roleDescriptions = Map.of(
                RoleType.ADMIN, "System Administrator with full access across all modules",
                RoleType.INVENTORY_MANAGER, "Inventory control, catalog management, and stock adjustments",
                RoleType.WAREHOUSE_MANAGER, "Physical warehouse stock movement, audits, and transfers",
                RoleType.PROCUREMENT_MANAGER, "Supplier management, purchase orders, and goods receipts",
                RoleType.ORDER_MANAGER, "Customer orders, inventory reservations, and fulfillment pipeline",
                RoleType.CUSTOMER, "Self-service customer portal order tracking and placement",
                RoleType.SUPPLIER, "Vendor portal purchase order review and dispatch fulfillment"
        );

        for (Map.Entry<RoleType, String> entry : roleDescriptions.entrySet()) {
            RoleType roleType = entry.getKey();
            String description = entry.getValue();

            Role role = roleRepository.findByName(roleType)
                    .orElseGet(() -> {
                        log.info("Creating baseline role: {}", roleType);
                        return roleRepository.save(Role.builder()
                                .name(roleType)
                                .description(description)
                                .build());
                    });
            roles.put(roleType, role);
        }

        return roles;
    }

    private void seedDefaultAdmin(Map<RoleType, Role> roleMap) {
        String adminUsername = "admin123";
        User existingAdmin = userRepository.findByUsername(adminUsername).orElse(null);
        if (existingAdmin == null) {
            // Check if existing user with email "admin@retail.com" or username "admin" exists
            User legacyAdmin = userRepository.findByUsername("admin")
                    .or(() -> userRepository.findByEmail("admin@retail.com"))
                    .orElse(null);

            if (legacyAdmin != null) {
                legacyAdmin.setUsername(adminUsername);
                legacyAdmin.setEmail("admin@retail.com");
                legacyAdmin.setPassword(passwordEncoder.encode("admin@123"));
                legacyAdmin.setRoles(Set.of(roleMap.get(RoleType.ADMIN)));
                legacyAdmin.setIsActive(true);
                userRepository.save(legacyAdmin);
                log.info("Renamed administrator account to '{}' with password='admin@123'", adminUsername);
                return;
            }

            log.info("Seeding Administrator account (username: {})...", adminUsername);
            User newAdmin = User.builder()
                    .username(adminUsername)
                    .email("admin@retail.com")
                    .password(passwordEncoder.encode("admin@123"))
                    .firstName("System")
                    .lastName("Administrator")
                    .isActive(true)
                    .roles(Set.of(roleMap.get(RoleType.ADMIN)))
                    .build();
            userRepository.save(newAdmin);
            log.info("Administrator account created: username='{}', password='admin@123'", adminUsername);
        } else {
            existingAdmin.setPassword(passwordEncoder.encode("admin@123"));
            existingAdmin.setRoles(Set.of(roleMap.get(RoleType.ADMIN)));
            existingAdmin.setIsActive(true);
            userRepository.save(existingAdmin);
            log.info("Updated {} account with password='admin@123'", adminUsername);

            Long activeAdminId = existingAdmin.getId();
            // Clean up old legacy 'admin' if it exists separately
            userRepository.findByUsername("admin").ifPresent(legacyAdmin -> {
                if (!legacyAdmin.getId().equals(activeAdminId)) {
                    userRepository.delete(legacyAdmin);
                    log.info("Removed legacy 'admin' user account.");
                }
            });
        }
    }

    private void seedRoleDemoUsers(Map<RoleType, Role> roleMap) {
        createDemoUserIfMissing("inventory_mgr", "inventory@retail.com", "Inventory", "Manager",
                RoleType.INVENTORY_MANAGER, roleMap);
        createDemoUserIfMissing("warehouse_mgr", "warehouse@retail.com", "Warehouse", "Manager",
                RoleType.WAREHOUSE_MANAGER, roleMap);
        createDemoUserIfMissing("procurement_mgr", "procurement@retail.com", "Procurement", "Manager",
                RoleType.PROCUREMENT_MANAGER, roleMap);
        createDemoUserIfMissing("order_mgr", "order@retail.com", "Order", "Manager",
                RoleType.ORDER_MANAGER, roleMap);
    }

    private void createDemoUserIfMissing(String username, String email, String firstName, String lastName,
                                         RoleType roleType, Map<RoleType, Role> roleMap) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode("Manager@123"))
                    .firstName(firstName)
                    .lastName(lastName)
                    .isActive(true)
                    .roles(Set.of(roleMap.get(roleType)))
                    .build();
            userRepository.save(user);
            log.info("Created role test user '{}' ({}) with password 'Manager@123'", username, roleType);
        }
    }

    private void seedCatalog() {
        if (categoryRepository.count() == 0) {
            log.info("Seeding baseline product categories and catalog items...");

            Category electronics = categoryRepository.save(Category.builder()
                    .name("Electronics")
                    .description("Laptops, mobile devices, audio gear & digital accessories")
                    .build());

            Category footwear = categoryRepository.save(Category.builder()
                    .name("Footwear")
                    .description("Athletic running shoes, sneakers & formal leather boots")
                    .build());

            Category apparel = categoryRepository.save(Category.builder()
                    .name("Apparel")
                    .description("Premium cotton t-shirts, jackets, hoodies & stretch denim")
                    .build());

            Category homeKitchen = categoryRepository.save(Category.builder()
                    .name("Home & Kitchen")
                    .description("Automated espresso machines, smart blenders & cookware")
                    .build());

            // Seed initial products
            createProductIfMissing("SKU-ELEC-MBP15", "Pro Laptop 15-inch M3", electronics,
                    "High-performance workstation laptop with 32GB unified RAM and 1TB SSD",
                    new BigDecimal("1450.00"), new BigDecimal("1999.00"), 5);

            createProductIfMissing("SKU-ELEC-EARBUD", "Wireless ANC Earbuds Pro", electronics,
                    "Active noise-canceling wireless earbuds with 36-hour battery case",
                    new BigDecimal("85.00"), new BigDecimal("169.99"), 20);

            createProductIfMissing("SKU-FOOT-RUNNER", "AeroPulse Running Shoes", footwear,
                    "Lightweight responsive foam running shoes with breathable mesh upper",
                    new BigDecimal("55.00"), new BigDecimal("129.50"), 15);

            createProductIfMissing("SKU-APPR-DENIM", "Slim-Fit Stretch Denim Jeans", apparel,
                    "Classic indigo dyed durable denim with comfortable flex fabric",
                    new BigDecimal("24.00"), new BigDecimal("64.99"), 25);

            createProductIfMissing("SKU-HOME-ESPR", "Artisan Touch Espresso Machine", homeKitchen,
                    "15-bar Italian pump dual-boiler espresso maker with digital PID control",
                    new BigDecimal("340.00"), new BigDecimal("679.00"), 8);

            log.info("Catalog seeding completed successfully.");
        }
    }

    private void createProductIfMissing(String sku, String name, Category category, String desc,
                                        BigDecimal costPrice, BigDecimal sellingPrice, int reorderLevel) {
        if (productRepository.findBySku(sku).isEmpty()) {
            Product product = Product.builder()
                    .sku(sku)
                    .name(name)
                    .category(category)
                    .description(desc)
                    .costPrice(costPrice)
                    .sellingPrice(sellingPrice)
                    .reorderLevel(reorderLevel)
                    .status(ProductStatus.ACTIVE)
                    .build();
            productRepository.save(product);
        }
    }

    private void seedWarehouses() {
        if (warehouseRepository.count() == 0) {
            log.info("Seeding baseline enterprise warehouses and fulfillment centers...");

            createWarehouseIfMissing(
                    "Central Logistics Hub",
                    "1000 Industrial Parkway, Dock 1-12",
                    "Chicago",
                    150000,
                    "Marcus Vance",
                    WarehouseStatus.ACTIVE
            );

            createWarehouseIfMissing(
                    "West Coast Distribution Center",
                    "450 Pacific Commerce Way",
                    "Los Angeles",
                    120000,
                    "Elena Rostova",
                    WarehouseStatus.ACTIVE
            );

            createWarehouseIfMissing(
                    "East Coast Fulfillment Center",
                    "820 Gateway Blvd, Suite 400",
                    "Newark",
                    95000,
                    "Devon Clark",
                    WarehouseStatus.ACTIVE
            );

            createWarehouseIfMissing(
                    "Southern Regional Facility",
                    "310 Alamo Logistics Center",
                    "Dallas",
                    75000,
                    "Sarah Jenkins",
                    WarehouseStatus.ACTIVE
            );

            createWarehouseIfMissing(
                    "Pacific Northwest Depot (Inactive)",
                    "12 Harbor Way, Berth 4",
                    "Seattle",
                    50000,
                    "Trevor Belmont",
                    WarehouseStatus.INACTIVE
            );

            log.info("Warehouse baseline seeding completed successfully.");
        }
    }

    private void createWarehouseIfMissing(String name, String address, String city,
                                          Integer capacity, String managerName, WarehouseStatus status) {
        if (warehouseRepository.findByName(name).isEmpty()) {
            Warehouse warehouse = Warehouse.builder()
                    .name(name)
                    .address(address)
                    .city(city)
                    .capacity(capacity)
                    .managerName(managerName)
                    .status(status)
                    .build();
            warehouseRepository.save(warehouse);
        }
    }

    private void seedInventory() {
        if (inventoryRepository.count() == 0) {
            log.info("Seeding baseline multi-warehouse inventory stock and initial ledgers...");

            warehouseRepository.findByName("Central Logistics Hub").ifPresent(chicago -> {
                productRepository.findBySku("SKU-ELEC-MBP15").ifPresent(laptop ->
                        createInitialStock(laptop, chicago, 45, 5, 10));

                productRepository.findBySku("SKU-ELEC-EARBUD").ifPresent(earbuds ->
                        createInitialStock(earbuds, chicago, 120, 15, 20));

                productRepository.findBySku("SKU-FOOT-RUNNER").ifPresent(shoes ->
                        createInitialStock(shoes, chicago, 8, 2, 15)); // Trigger low-stock (avail 6 <= 15)

                productRepository.findBySku("SKU-APPR-DENIM").ifPresent(jeans ->
                        createInitialStock(jeans, chicago, 200, 25, 30));

                productRepository.findBySku("SKU-HOME-ESPR").ifPresent(espresso ->
                        createInitialStock(espresso, chicago, 18, 0, 8));
            });

            warehouseRepository.findByName("West Coast Distribution Center").ifPresent(la -> {
                productRepository.findBySku("SKU-ELEC-MBP15").ifPresent(laptop ->
                        createInitialStock(laptop, la, 25, 0, 10));

                productRepository.findBySku("SKU-ELEC-EARBUD").ifPresent(earbuds ->
                        createInitialStock(earbuds, la, 80, 10, 20));

                productRepository.findBySku("SKU-FOOT-RUNNER").ifPresent(shoes ->
                        createInitialStock(shoes, la, 90, 5, 15));

                productRepository.findBySku("SKU-APPR-DENIM").ifPresent(jeans ->
                        createInitialStock(jeans, la, 140, 10, 30));

                productRepository.findBySku("SKU-HOME-ESPR").ifPresent(espresso ->
                        createInitialStock(espresso, la, 4, 1, 8)); // Trigger low-stock (avail 3 <= 8)
            });

            log.info("Multi-warehouse inventory stock seeding completed successfully.");
        }
    }

    private void createInitialStock(Product product, Warehouse warehouse, int total, int reserved, int reorder) {
        if (inventoryRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId()).isEmpty()) {
            Inventory inv = Inventory.builder()
                    .product(product)
                    .warehouse(warehouse)
                    .totalQuantity(total)
                    .reservedQuantity(reserved)
                    .reorderLevel(reorder)
                    .build();
            inventoryRepository.save(inv);

            InventoryTransaction tx = InventoryTransaction.builder()
                    .product(product)
                    .warehouse(warehouse)
                    .quantityDelta(total)
                    .transactionType(InventoryTransactionType.STOCK_IN)
                    .referenceId("INIT-SEED")
                    .performedBy("SYSTEM_INIT")
                    .reason("Initial system opening stock")
                    .timestamp(Instant.now())
                    .build();
            inventoryTransactionRepository.save(tx);
        }
    }

    private void seedProcurement() {
        if (supplierRepository.count() == 0) {
            log.info("Seeding baseline suppliers and procurement purchase orders...");

            Supplier nexus = supplierRepository.save(Supplier.builder()
                    .name("Nexus Tech Global Supplies")
                    .contactPerson("David Vance")
                    .email("orders@nexustech.com")
                    .phone("+1-555-0192")
                    .address("45 Silicon Parkway, Suite 300, San Jose, CA")
                    .status(SupplierStatus.ACTIVE)
                    .build());

            Supplier apex = supplierRepository.save(Supplier.builder()
                    .name("Apex Athletic & Footwear Ltd.")
                    .contactPerson("Rachel Zane")
                    .email("sales@apexgear.com")
                    .phone("+1-555-0184")
                    .address("100 Stadium Way, Eugene, OR")
                    .status(SupplierStatus.ACTIVE)
                    .build());

            Supplier cotton = supplierRepository.save(Supplier.builder()
                    .name("Heritage Cotton Mills Inc.")
                    .contactPerson("Thomas Sterling")
                    .email("b2b@heritagecotton.com")
                    .phone("+1-555-0176")
                    .address("220 Textile Blvd, Charlotte, NC")
                    .status(SupplierStatus.ACTIVE)
                    .build());

            // Create a sample SUBMITTED purchase order ready to test receiveGoods
            warehouseRepository.findByName("Central Logistics Hub").ifPresent(chicago -> {
                productRepository.findBySku("SKU-ELEC-MBP15").ifPresent(laptop -> {
                    productRepository.findBySku("SKU-ELEC-EARBUD").ifPresent(earbuds -> {
                        PurchaseOrder po = PurchaseOrder.builder()
                                .poNumber("PO-2026-00101")
                                .supplier(nexus)
                                .warehouse(chicago)
                                .status(PurchaseOrderStatus.SUBMITTED)
                                .notes("Q4 High-priority electronics replenishment batch")
                                .items(new ArrayList<>())
                                .build();

                        PurchaseOrderItem item1 = PurchaseOrderItem.builder()
                                .purchaseOrder(po)
                                .product(laptop)
                                .quantity(20)
                                .unitCost(new BigDecimal("1400.00"))
                                .build();

                        PurchaseOrderItem item2 = PurchaseOrderItem.builder()
                                .purchaseOrder(po)
                                .product(earbuds)
                                .quantity(50)
                                .unitCost(new BigDecimal("80.00"))
                                .build();

                        po.addItem(item1);
                        po.addItem(item2);
                        po.setTotalAmount(new BigDecimal("32000.00")); // 20*1400 + 50*80 = 28000 + 4000 = 32000

                        purchaseOrderRepository.save(po);
                    });
                });
            });

            log.info("Procurement baseline suppliers and sample PO seeded successfully.");
        }
    }

    private void seedOrders() {
        if (customerRepository.count() == 0) {
            log.info("Seeding baseline customers and customer orders...");

            com.retail.inventory.order.entity.Customer sophia = customerRepository.save(
                    com.retail.inventory.order.entity.Customer.builder()
                            .name("Sophia Martinez")
                            .email("sophia.martinez@gmail.com")
                            .phone("+1-555-0349")
                            .address("742 Evergreen Terrace, Springfield, OR")
                            .build()
            );

            com.retail.inventory.order.entity.Customer acme = customerRepository.save(
                    com.retail.inventory.order.entity.Customer.builder()
                            .name("Acme Corp Logistics")
                            .email("orders@acmecorp.com")
                            .phone("+1-555-0912")
                            .address("100 Enterprise Way, Suite 400, Chicago, IL")
                            .build()
            );

            com.retail.inventory.order.entity.Customer horizon = customerRepository.save(
                    com.retail.inventory.order.entity.Customer.builder()
                            .name("Horizon Retailers Ltd")
                            .email("purchasing@horizonretail.com")
                            .phone("+1-555-0823")
                            .address("500 Market Street, San Francisco, CA")
                            .build()
            );

            warehouseRepository.findByName("Central Logistics Hub").ifPresent(chicago -> {
                warehouseRepository.findByName("West Coast Distribution Center").ifPresent(la -> {
                    productRepository.findBySku("SKU-FOOT-RUNNER").ifPresent(shoes -> {
                        productRepository.findBySku("SKU-ELEC-HEADPHONE").ifPresent(headphones -> {
                            productRepository.findBySku("SKU-HOME-ESPR").ifPresent(espresso -> {

                                // 1. PENDING order
                                com.retail.inventory.order.entity.Order pendingOrder = com.retail.inventory.order.entity.Order.builder()
                                        .orderNumber("ORD-2026-00001")
                                        .customer(sophia)
                                        .warehouse(la)
                                        .status(com.retail.inventory.order.entity.OrderStatus.PENDING)
                                        .notes("Customer requested express delivery if possible")
                                        .items(new ArrayList<>())
                                        .build();

                                com.retail.inventory.order.entity.OrderItem pItem1 = com.retail.inventory.order.entity.OrderItem.builder()
                                        .order(pendingOrder)
                                        .product(shoes)
                                        .quantity(2)
                                        .unitPrice(shoes.getSellingPrice())
                                        .build();

                                pendingOrder.addItem(pItem1);
                                pendingOrder.setTotalAmount(shoes.getSellingPrice().multiply(BigDecimal.valueOf(2)));
                                orderRepository.save(pendingOrder);

                                // 2. CONFIRMED order (with stock reserved)
                                com.retail.inventory.order.entity.Order confirmedOrder = com.retail.inventory.order.entity.Order.builder()
                                        .orderNumber("ORD-2026-00002")
                                        .customer(acme)
                                        .warehouse(chicago)
                                        .status(com.retail.inventory.order.entity.OrderStatus.CONFIRMED)
                                        .notes("B2B Corporate office expansion order")
                                        .items(new ArrayList<>())
                                        .build();

                                com.retail.inventory.order.entity.OrderItem cItem1 = com.retail.inventory.order.entity.OrderItem.builder()
                                        .order(confirmedOrder)
                                        .product(headphones)
                                        .quantity(3)
                                        .unitPrice(headphones.getSellingPrice())
                                        .build();

                                confirmedOrder.addItem(cItem1);
                                confirmedOrder.setTotalAmount(headphones.getSellingPrice().multiply(BigDecimal.valueOf(3)));
                                orderRepository.save(confirmedOrder);

                                // Reserve stock for confirmed order in inventory
                                inventoryRepository.findByProductIdAndWarehouseId(headphones.getId(), chicago.getId())
                                        .ifPresent(inv -> {
                                            inv.setReservedQuantity(inv.getReservedQuantity() + 3);
                                            inventoryRepository.save(inv);

                                            inventoryTransactionRepository.save(
                                                    com.retail.inventory.inventory.entity.InventoryTransaction.builder()
                                                            .product(headphones)
                                                            .warehouse(chicago)
                                                            .quantityDelta(-3)
                                                            .transactionType(com.retail.inventory.inventory.entity.InventoryTransactionType.RESERVATION)
                                                            .referenceId("ORD-2026-00002")
                                                            .performedBy("SYSTEM")
                                                            .reason("Stock reservation for Order ORD-2026-00002")
                                                            .timestamp(Instant.now())
                                                            .build()
                                            );
                                        });

                                // 3. PACKED order (ready for dispatch in Fulfillment queue)
                                com.retail.inventory.order.entity.Order packedOrder = com.retail.inventory.order.entity.Order.builder()
                                        .orderNumber("ORD-2026-00003")
                                        .customer(horizon)
                                        .warehouse(chicago)
                                        .status(com.retail.inventory.order.entity.OrderStatus.PACKED)
                                        .notes("Priority shipment batch - boxed and verified")
                                        .items(new ArrayList<>())
                                        .build();

                                com.retail.inventory.order.entity.OrderItem pkItem1 = com.retail.inventory.order.entity.OrderItem.builder()
                                        .order(packedOrder)
                                        .product(espresso)
                                        .quantity(1)
                                        .unitPrice(espresso.getSellingPrice())
                                        .build();

                                packedOrder.addItem(pkItem1);
                                packedOrder.setTotalAmount(espresso.getSellingPrice());
                                orderRepository.save(packedOrder);

                                inventoryRepository.findByProductIdAndWarehouseId(espresso.getId(), chicago.getId())
                                        .ifPresent(inv -> {
                                            inv.setReservedQuantity(inv.getReservedQuantity() + 1);
                                            inventoryRepository.save(inv);

                                            inventoryTransactionRepository.save(
                                                    com.retail.inventory.inventory.entity.InventoryTransaction.builder()
                                                            .product(espresso)
                                                            .warehouse(chicago)
                                                            .quantityDelta(-1)
                                                            .transactionType(com.retail.inventory.inventory.entity.InventoryTransactionType.RESERVATION)
                                                            .referenceId("ORD-2026-00003")
                                                            .performedBy("SYSTEM")
                                                            .reason("Stock reservation for Order ORD-2026-00003")
                                                            .timestamp(Instant.now())
                                                            .build()
                                            );
                                        });
                            });
                        });
                    });
                });
            });

            log.info("Customer and order management baseline records seeded successfully.");
        }
    }

    private void cleanUpDemoAccountsForProduction() {
        log.info("Production mode: Ensuring demo user accounts are removed from the database...");
        userRepository.findByUsername("customer_demo").ifPresent(user -> {
            userRepository.delete(user);
            log.info("Cleaned up demo account 'customer_demo' for live release.");
        });

        userRepository.findByUsername("supplier_demo").ifPresent(user -> {
            userRepository.delete(user);
            log.info("Cleaned up demo account 'supplier_demo' for live release.");
        });
    }
}
