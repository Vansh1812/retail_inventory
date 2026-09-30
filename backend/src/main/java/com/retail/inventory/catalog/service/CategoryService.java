package com.retail.inventory.catalog.service;

import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.dto.CategoryDto;
import com.retail.inventory.catalog.dto.CategoryRequest;
import com.retail.inventory.catalog.entity.Category;
import com.retail.inventory.catalog.repository.CategoryRepository;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(cat -> CategoryDto.fromEntity(cat, productRepository.countByCategoryId(cat.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        long productCount = productRepository.countByCategoryId(id);
        return CategoryDto.fromEntity(category, productCount);
    }

    @Transactional
    public CategoryDto createCategory(CategoryRequest request, String performedBy) {
        String trimmedName = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new ValidationException("Category '" + trimmedName + "' already exists");
        }

        Category category = Category.builder()
                .name(trimmedName)
                .description(request.getDescription())
                .build();

        Category saved = categoryRepository.save(category);

        auditLogRepository.save(com.retail.inventory.admin.entity.AuditLog.builder()
                .action("CATEGORY_CREATED")
                .entityName("Category")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Created category '%s'", saved.getName()))
                .build());

        log.info("Category '{}' created by '{}'", saved.getName(), performedBy);
        return CategoryDto.fromEntity(saved, 0L);
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryRequest request, String performedBy) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        String trimmedName = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new ValidationException("Another category with name '" + trimmedName + "' already exists");
        }

        category.setName(trimmedName);
        category.setDescription(request.getDescription());
        Category updated = categoryRepository.save(category);

        auditLogRepository.save(com.retail.inventory.admin.entity.AuditLog.builder()
                .action("CATEGORY_UPDATED")
                .entityName("Category")
                .entityId(id.toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Updated category '%s'", updated.getName()))
                .build());

        log.info("Category '{}' updated by '{}'", updated.getName(), performedBy);
        return CategoryDto.fromEntity(updated, productRepository.countByCategoryId(id));
    }

    @Transactional
    public void deleteCategory(Long id, String performedBy) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new ValidationException("Cannot delete category '" + category.getName() + "' because it contains " + productCount + " products.");
        }

        categoryRepository.delete(category);

        auditLogRepository.save(com.retail.inventory.admin.entity.AuditLog.builder()
                .action("CATEGORY_DELETED")
                .entityName("Category")
                .entityId(id.toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Deleted category '%s'", category.getName()))
                .build());

        log.info("Category '{}' deleted by '{}'", category.getName(), performedBy);
    }
}
