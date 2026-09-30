package com.retail.inventory.catalog.service;

import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.dto.ProductDto;
import com.retail.inventory.catalog.dto.ProductRequest;
import com.retail.inventory.catalog.entity.Category;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.entity.ProductStatus;
import com.retail.inventory.catalog.repository.CategoryRepository;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public Page<ProductDto> getProducts(int page, int size, String search, Long categoryId, ProductStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (cleanSearch != null) {
                String searchPattern = "%" + cleanSearch.toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate skuLike = cb.like(cb.lower(root.get("sku")), searchPattern);
                predicates.add(cb.or(nameLike, skuLike));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> products = productRepository.findAll(spec, pageable);
        return products.map(ProductDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return ProductDto.fromEntity(product);
    }

    @Transactional(readOnly = true)
    public ProductDto getProductBySku(String sku) {
        Product product = productRepository.findBySku(sku.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "sku", sku));
        return ProductDto.fromEntity(product);
    }

    @Transactional
    public ProductDto createProduct(ProductRequest request, String performedBy) {
        String normalizedSku = request.getSku().trim().toUpperCase();

        if (productRepository.existsBySku(normalizedSku)) {
            throw new ValidationException("A product with SKU '" + normalizedSku + "' already exists.");
        }

        if (request.getSellingPrice().compareTo(request.getCostPrice()) < 0) {
            log.warn("Product SKU '{}' created with selling price lower than cost price", normalizedSku);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Product product = Product.builder()
                .sku(normalizedSku)
                .name(request.getName().trim())
                .category(category)
                .description(request.getDescription())
                .costPrice(request.getCostPrice())
                .sellingPrice(request.getSellingPrice())
                .reorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : 10)
                .status(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE)
                .build();

        Product saved = productRepository.save(product);

        auditLogRepository.save(com.retail.inventory.admin.entity.AuditLog.builder()
                .action("PRODUCT_CREATED")
                .entityName("Product")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Created SKU '%s' (%s) under category '%s'",
                        saved.getSku(), saved.getName(), category.getName()))
                .build());

        log.info("Product '{}' ({}) created by '{}'", saved.getSku(), saved.getName(), performedBy);
        return ProductDto.fromEntity(saved);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequest request, String performedBy) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        String normalizedSku = request.getSku().trim().toUpperCase();
        if (productRepository.existsBySkuAndIdNot(normalizedSku, id)) {
            throw new ValidationException("Another product with SKU '" + normalizedSku + "' already exists.");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        product.setSku(normalizedSku);
        product.setName(request.getName().trim());
        product.setCategory(category);
        product.setDescription(request.getDescription());
        product.setCostPrice(request.getCostPrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setReorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : 10);
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        Product updated = productRepository.save(product);

        auditLogRepository.save(com.retail.inventory.admin.entity.AuditLog.builder()
                .action("PRODUCT_UPDATED")
                .entityName("Product")
                .entityId(id.toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Updated product SKU '%s'", updated.getSku()))
                .build());

        log.info("Product '{}' updated by '{}'", updated.getSku(), performedBy);
        return ProductDto.fromEntity(updated);
    }

    @Transactional
    public ProductDto toggleProductStatus(Long id, String performedBy) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        ProductStatus nextStatus = (product.getStatus() == ProductStatus.ACTIVE)
                ? ProductStatus.INACTIVE
                : ProductStatus.ACTIVE;

        product.setStatus(nextStatus);
        Product saved = productRepository.save(product);

        String action = (nextStatus == ProductStatus.ACTIVE) ? "PRODUCT_ACTIVATED" : "PRODUCT_DEACTIVATED";
        auditLogRepository.save(com.retail.inventory.admin.entity.AuditLog.builder()
                .action(action)
                .entityName("Product")
                .entityId(id.toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Toggled status of SKU '%s' to %s", saved.getSku(), nextStatus))
                .build());

        log.info("Product '{}' status changed to {} by '{}'", saved.getSku(), nextStatus, performedBy);
        return ProductDto.fromEntity(saved);
    }

    @Transactional
    public void deleteProduct(Long id, String performedBy) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        // Soft-delete: mark as INACTIVE to protect historical ledgers
        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);

        auditLogRepository.save(com.retail.inventory.admin.entity.AuditLog.builder()
                .action("PRODUCT_DEACTIVATED")
                .entityName("Product")
                .entityId(id.toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Deactivated product SKU '%s'", product.getSku()))
                .build());

        log.info("Product '{}' marked INACTIVE by '{}'", product.getSku(), performedBy);
    }
}
