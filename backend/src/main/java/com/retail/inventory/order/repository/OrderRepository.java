package com.retail.inventory.order.repository;

import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByOrderNumber(String orderNumber);
    boolean existsByOrderNumber(String orderNumber);
    List<Order> findByStatusInOrderByCreatedAtAsc(Collection<OrderStatus> statuses);
    long countByStatusIn(Collection<OrderStatus> statuses);
    List<Order> findTop5ByOrderByCreatedAtDesc();
    List<Order> findByCreatedAtBetween(java.time.Instant start, java.time.Instant end);
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Optional<Order> findByIdAndCustomerId(Long id, Long customerId);
}
