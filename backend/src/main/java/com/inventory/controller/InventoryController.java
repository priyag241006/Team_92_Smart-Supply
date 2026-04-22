package com.inventory.controller;

import com.inventory.model.Product;
import com.inventory.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryController {

    private final InventoryService inventoryService;
    private final AlertService alertService;
    private final DemandService demandService;

    public InventoryController(InventoryService inv, AlertService alert, DemandService demand) {
        this.inventoryService = inv;
        this.alertService = alert;
        this.demandService = demand;
    }

    @GetMapping("/products")
    public List<Product> getAllProducts() { return inventoryService.getAllProducts(); }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable String id) {
        Product p = inventoryService.getProduct(id);
        return p != null ? ResponseEntity.ok(p) : ResponseEntity.notFound().build();
    }

    @PostMapping("/products")
    public ResponseEntity<String> addProduct(@RequestBody Map<String, Object> body) {
        try {
            String id = (String) body.get("id");
            if (inventoryService.getProduct(id) != null) {
                return ResponseEntity.badRequest().body("Product ID already exists: " + id);
            }
            Product p = new Product(
                id,
                (String) body.get("name"),
                (String) body.get("category"),
                (int) body.get("quantity"),
                (int) body.get("threshold"),
                ((Number) body.get("price")).doubleValue(),
                LocalDate.parse((String) body.get("expiryDate"))
            );
            inventoryService.addProduct(p);
            return ResponseEntity.ok("Product added: " + p.getId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable String id) {
        boolean deleted = inventoryService.deleteProduct(id);
        return deleted ? ResponseEntity.ok("Deleted: " + id) : ResponseEntity.notFound().build();
    }

    @PostMapping("/billing/sell")
    public ResponseEntity<Map<String, Object>> sell(@RequestBody Map<String, Object> body) {
        String productId = (String) body.get("productId");
        int qty = (int) body.get("quantity");
        Map<String, Object> result = inventoryService.processSale(productId, qty);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/billing/undo")
    public ResponseEntity<Map<String, Object>> undo() {
        Map<String, Object> result = inventoryService.undoLastSale();
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/billing/history")
    public List<Map<String, Object>> getSaleHistory() {
        List<Map<String, Object>> history = new ArrayList<>();
        for (var r : inventoryService.getSaleStack().getHistory()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId",   r.productId);
            m.put("productName", r.productName);
            m.put("qtySold",     r.qtySold);
            m.put("timestamp",   r.timestamp);
            history.add(m);
        }
        return history;
    }

    @GetMapping("/alerts")
    public Map<String, Object> getAllAlerts() { return alertService.getAllAlerts(); }

    @GetMapping("/alerts/lowstock")
    public List<Map<String, Object>> getLowStockAlerts() { return alertService.getLowStockAlerts(); }

    @GetMapping("/alerts/expiry")
    public List<Map<String, Object>> getExpiryAlerts(@RequestParam(defaultValue = "7") int days) {
        return alertService.getExpiryAlerts(days);
    }

    @GetMapping("/alerts/velocity")
    public List<Map<String, Object>> getVelocityAlerts() { return alertService.getVelocityAlerts(7, 3.0); }

    @GetMapping("/analytics/daily")
    public List<Map<String, Object>> getDailySales(@RequestParam(defaultValue = "14") int days) {
        return demandService.getDailySalesSummary(days);
    }

    @GetMapping("/analytics/top")
    public List<Map<String, Object>> getTopSelling(
            @RequestParam(defaultValue = "14") int days,
            @RequestParam(defaultValue = "5") int n) {
        return demandService.getTopSellingProducts(days, n);
    }

    @GetMapping("/analytics/forecast/{productId}")
    public Map<String, Object> getForecast(@PathVariable String productId,
            @RequestParam(defaultValue = "7") int window) {
        return demandService.getForecast(productId, window);
    }

    @GetMapping("/products/range/price")
    public List<Product> byPriceRange(@RequestParam double lo, @RequestParam double hi) {
        return inventoryService.getByPriceRange(lo, hi);
    }

    @GetMapping("/products/range/stock")
    public List<Product> byStockRange(@RequestParam double lo, @RequestParam double hi) {
        return inventoryService.getByStockRange(lo, hi);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardSummary() {
        List<Product> all = inventoryService.getAllProducts();
        int lowStockCount  = alertService.getLowStockAlerts().size();
        int expiryCount    = alertService.getExpiryAlerts(7).size();
        int velocityCount  = alertService.getVelocityAlerts(7, 3.0).size();
        double totalValue  = all.stream().mapToDouble(p -> p.getPrice() * p.getQuantity()).sum();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalProducts", all.size());
        summary.put("totalAlerts",   lowStockCount + expiryCount + velocityCount);
        summary.put("lowStockCount", lowStockCount);
        summary.put("expiryCount",   expiryCount);
        summary.put("velocityCount", velocityCount);
        summary.put("totalValue",    Math.round(totalValue * 100.0) / 100.0);
        summary.put("topProduct",    demandService.getTopSellingProducts(7, 1));
        return summary;
    }

    @GetMapping("/expired-log")
    public List<Map<String, Object>> getExpiredLog() {
        return inventoryService.getRecentlyExpiredLog();
    }

    @DeleteMapping("/expired-log")
    public ResponseEntity<String> clearExpiredLog() {
        inventoryService.clearExpiredLog();
        return ResponseEntity.ok("Cleared");
    }
}