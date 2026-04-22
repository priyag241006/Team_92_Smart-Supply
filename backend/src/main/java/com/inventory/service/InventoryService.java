package com.inventory.service;

import com.inventory.ds.*;
import com.inventory.model.Product;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class InventoryService {

    private final ProductHashMap hashMap = new ProductHashMap();
    private final MinHeap<Product> stockHeap = new MinHeap<>(
            Comparator.comparingInt(Product::getQuantity));
    private final MinHeap<Product> expiryHeap = new MinHeap<>(
            Comparator.comparing(Product::getExpiryDate));
    private final SaleStack saleStack = new SaleStack(50);
    private final AVLTree priceTree = new AVLTree();
    private final AVLTree stockTree = new AVLTree();
    private final Map<String, TreeMap<LocalDate, Integer>> salesLog = new HashMap<>();

    private final List<Map<String, Object>> recentlyExpiredLog = new ArrayList<>();

    public InventoryService() {
        List<Product> samples = Arrays.asList(
            // Dairy
            new Product("P001", "Amul Milk 500ml",        "Dairy",      120, 20, 28.0,   LocalDate.now().plusDays(3)),
            new Product("P002", "Amul Butter 500g",       "Dairy",       12, 15, 260.0,  LocalDate.now().plusDays(10)),
            new Product("P003", "Mother Dairy Curd 400g", "Dairy",       35, 20, 54.0,   LocalDate.now().minusDays(1)),
            new Product("P004", "Amul Cheese Slices",     "Dairy",       25, 10, 180.0,  LocalDate.now().plusDays(15)),
            new Product("P005", "Nestle Yogurt 100g",     "Dairy",       40, 15, 35.0,   LocalDate.now().plusDays(6)),

            // Bakery
            new Product("P006", "Britannia Bread",        "Bakery",      45, 15, 42.0,   LocalDate.now().plusDays(5)),
            new Product("P007", "Harvest Gold Bread",     "Bakery",      30, 10, 38.0,   LocalDate.now().plusDays(4)),
            new Product("P008", "Britannia Cake",         "Bakery",      20, 10, 35.0,   LocalDate.now().plusDays(20)),

            // Grains
            new Product("P009", "Fortune Rice 5kg",       "Grains",      80, 10, 285.0,  LocalDate.now().plusMonths(6)),
            new Product("P010", "Aashirvaad Atta 5kg",    "Grains",      55, 10, 290.0,  LocalDate.now().plusMonths(4)),
            new Product("P011", "Tata Salt 1kg",          "Essentials", 150, 25, 22.0,   LocalDate.now().plusMonths(12)),
            new Product("P012", "Fortune Poha 500g",      "Grains",      40, 10, 55.0,   LocalDate.now().plusMonths(5)),

            // Snacks
            new Product("P013", "Maggi Noodles 70g",      "Snacks",     200, 30, 14.0,   LocalDate.now().plusMonths(8)),
            new Product("P014", "Parle-G Biscuits",       "Snacks",       8, 20, 10.0,   LocalDate.now().plusMonths(5)),
            new Product("P015", "Haldirams Bhujia 200g",  "Snacks",      60, 20, 120.0,  LocalDate.now().plusMonths(3)),
            new Product("P016", "Lays Classic Chips",     "Snacks",      75, 20, 20.0,   LocalDate.now().plusMonths(2)),
            new Product("P017", "Kurkure Masala 90g",     "Snacks",      65, 20, 20.0,   LocalDate.now().plusMonths(2)),
            new Product("P018", "Hide & Seek Biscuits",   "Snacks",      45, 15, 30.0,   LocalDate.now().plusMonths(6)),

            // Beverages
            new Product("P019", "Tropicana OJ 1L",        "Beverages",   18, 15, 99.0,   LocalDate.now().plusDays(7)),
            new Product("P020", "Coca-Cola 2L",           "Beverages",   90, 20, 95.0,   LocalDate.now().plusMonths(9)),
            new Product("P021", "Minute Maid Pulpy 1L",   "Beverages",   22, 15, 85.0,   LocalDate.now().plusDays(8)),
            new Product("P022", "Red Bull 250ml",         "Beverages",   50, 15, 125.0,  LocalDate.now().plusMonths(10)),
            new Product("P023", "Bisleri Water 1L",       "Beverages",  200, 40, 20.0,   LocalDate.now().plusMonths(12)),

            // Personal Care
            new Product("P024", "Colgate Toothpaste",     "Personal Care", 60, 15, 95.0, LocalDate.now().plusMonths(18)),
            new Product("P025", "Dove Soap 100g",         "Personal Care", 80, 20, 45.0, LocalDate.now().plusMonths(24)),
            new Product("P026", "Head & Shoulders 180ml", "Personal Care", 35, 10, 199.0,LocalDate.now().plusMonths(18)),

            // Household
            new Product("P027", "Surf Excel 1kg",         "Household",   40, 10, 220.0,  LocalDate.now().plusMonths(24)),
            new Product("P028", "Vim Dishwash Bar",       "Household",   55, 15, 35.0,   LocalDate.now().plusMonths(18))
        );
        samples.forEach(this::addProduct);

        Random rand = new Random(42);
        for (Product p : samples) {
            TreeMap<LocalDate, Integer> log = salesLog.computeIfAbsent(
                    p.getId(), k -> new TreeMap<>());
            for (int i = 14; i >= 1; i--) {
                int qty = 2 + rand.nextInt(p.getId().equals("P014") ? 12 : 4);
                log.put(LocalDate.now().minusDays(i), qty);
            }
        }
    }

    // ── Auto remove expired products every 60 seconds ─────────────────────
    @Scheduled(fixedRate = 60000)
    public void autoRemoveExpiredProducts() {
        List<Product> all = hashMap.values();
        for (Product p : all) {
            if (p.getExpiryDate() != null && p.getExpiryDate().isBefore(LocalDate.now())) {
                Map<String, Object> log = new LinkedHashMap<>();
                log.put("productId",   p.getId());
                log.put("productName", p.getName());
                log.put("expiryDate",  p.getExpiryDate().toString());
                log.put("removedAt",   System.currentTimeMillis());
                recentlyExpiredLog.add(log);
                deleteProduct(p.getId());
            }
        }
    }

    public List<Map<String, Object>> getRecentlyExpiredLog() {
        return new ArrayList<>(recentlyExpiredLog);
    }

    public void clearExpiredLog() {
        recentlyExpiredLog.clear();
    }

    // ── CRUD ──────────────────────────────────────────────────────────────

    public void addProduct(Product p) {
        hashMap.put(p.getId(), p);
        stockHeap.insert(p);
        expiryHeap.insert(p);
        priceTree.insert(p.getPrice(), p);
        stockTree.insert(p.getQuantity(), p);
        salesLog.putIfAbsent(p.getId(), new TreeMap<>());
    }

    public Product getProduct(String id) { return hashMap.get(id); }
    public List<Product> getAllProducts() { return hashMap.values(); }

    public boolean deleteProduct(String id) {
        Product p = hashMap.get(id);
        if (p == null) return false;
        hashMap.remove(id);
        stockHeap.remove(p);
        expiryHeap.remove(p);
        priceTree.remove(p.getPrice());
        stockTree.remove(p.getQuantity());
        return true;
    }

    public Map<String, Object> processSale(String productId, int qtySold) {
        Product p = hashMap.get(productId);
        Map<String, Object> result = new HashMap<>();
        if (p == null) {
            result.put("success", false);
            result.put("message", "Product not found");
            return result;
        }
        if (p.getQuantity() < qtySold) {
            result.put("success", false);
            result.put("message", "Insufficient stock. Available: " + p.getQuantity());
            return result;
        }
        int prev = p.getQuantity();
        stockHeap.remove(p);
        stockTree.remove(prev);
        p.setQuantity(prev - qtySold);
        stockHeap.insert(p);
        stockTree.insert(p.getQuantity(), p);
        saleStack.push(new SaleStack.SaleRecord(p.getId(), p.getName(), qtySold, prev));
        salesLog.get(productId).merge(LocalDate.now(), qtySold, Integer::sum);
        result.put("success", true);
        result.put("product", p);
        result.put("message", "Sale processed: " + qtySold + "x " + p.getName());
        return result;
    }

    public Map<String, Object> undoLastSale() {
        SaleStack.SaleRecord record = saleStack.pop();
        Map<String, Object> result = new HashMap<>();
        if (record == null) {
            result.put("success", false);
            result.put("message", "Nothing to undo");
            return result;
        }
        Product p = hashMap.get(record.productId);
        if (p != null) {
            stockHeap.remove(p);
            stockTree.remove(p.getQuantity());
            p.setQuantity(record.prevQuantity);
            stockHeap.insert(p);
            stockTree.insert(p.getQuantity(), p);
            TreeMap<LocalDate, Integer> log = salesLog.get(record.productId);
            if (log != null && log.containsKey(LocalDate.now())) {
                int updated = log.get(LocalDate.now()) - record.qtySold;
                if (updated <= 0) log.remove(LocalDate.now());
                else log.put(LocalDate.now(), updated);
            }
        }
        result.put("success", true);
        result.put("record", Map.of(
            "productId",   record.productId,
            "productName", record.productName,
            "qtySold",     record.qtySold,
            "timestamp",   record.timestamp
        ));
        result.put("message", "Undid sale of " + record.qtySold + "x " + record.productName);
        return result;
    }

    public MinHeap<Product> getStockHeap()  { return stockHeap; }
    public MinHeap<Product> getExpiryHeap() { return expiryHeap; }
    public SaleStack        getSaleStack()  { return saleStack; }

    public List<Product> getByPriceRange(double lo, double hi) { return priceTree.rangeQuery(lo, hi); }
    public List<Product> getByStockRange(double lo, double hi) { return stockTree.rangeQuery(lo, hi); }

    public Map<String, TreeMap<LocalDate, Integer>> getSalesLog() { return salesLog; }
    public TreeMap<LocalDate, Integer> getSalesForProduct(String productId) {
        return salesLog.getOrDefault(productId, new TreeMap<>());
    }
}