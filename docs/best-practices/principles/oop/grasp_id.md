# Prinsip GRASP

## Gambaran Umum

GRASP (General Responsibility Assignment Software Patterns) adalah kumpulan sembilan prinsip fundamental yang memandu penugasan tanggung jawab pada kelas dan objek dalam desain berorientasi objek. Pola-pola ini membantu developer membuat sistem software yang lebih mudah dipelihara, dipahami, dan fleksibel dengan memberikan panduan yang jelas untuk mendistribusikan tanggung jawab.

## Prinsip GRASP Inti

### 1. Information Expert
**Masalah**: Kelas mana yang harus bertanggung jawab untuk mengetahui atau melakukan hal-hal tertentu?

**Solusi**: Tetapkan tanggung jawab pada kelas yang memiliki informasi yang diperlukan untuk memenuhinya.

**Contoh**: Dalam sistem e-commerce, kelas `Order` harus menghitung totalnya karena berisi item baris dan harganya.

```java
public class Order {
    private List<OrderItem> items;

    public Money calculateTotal() {
        return items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(Money.zero(), Money::add);
    }
}
```

### 2. Creator
**Masalah**: Siapa yang harus bertanggung jawab untuk membuat instance dari sebuah kelas?

**Solusi**: Tetapkan kelas B tanggung jawab untuk membuat instance kelas A jika:
- B berisi atau mengagregasi A
- B mencatat instance A
- B sangat menggunakan A
- B memiliki data yang diperlukan untuk menginisialisasi A

**Contoh**: `Order` membuat instance `OrderItem` karena berisi mereka.

```java
public class Order {
    private List<OrderItem> items = new ArrayList<>();

    public OrderItem addItem(Product product, int quantity) {
        OrderItem item = new OrderItem(product, quantity, this);
        items.add(item);
        return item;
    }
}
```

### 3. Controller
**Masalah**: Objek apa yang menerima dan mengkoordinasi operasi sistem?

**Solusi**: Tetapkan tanggung jawab pada kelas controller yang mewakili:
- Sistem secara keseluruhan
- Skenario use case
- Sesi atau transaksi

**Contoh**: Controller use case menangani operasi bisnis.

```java
public class PlaceOrderController {
    private OrderRepository orderRepository;
    private ProductRepository productRepository;

    public Order placeOrder(PlaceOrderRequest request) {
        // Validasi request
        // Periksa ketersediaan produk
        // Buat order
        // Simpan ke repository
        // Return result
    }
}
```

### 4. Low Coupling
**Masalah**: Bagaimana mengurangi dependensi antar kelas?

**Solusi**: Tetapkan tanggung jawab untuk meminimalkan coupling antar kelas.

**Manfaat**:
- Perubahan terlokalisasi
- Sistem lebih mudah dipelihara
- Kelas lebih dapat digunakan ulang

**Contoh**: Gunakan interface dan dependency injection untuk mengurangi coupling.

```java
public class OrderProcessor {
    private PaymentService paymentService; // Interface, bukan concrete class

    public OrderProcessor(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

### 5. High Cohesion
**Masalah**: Bagaimana menjaga objek fokus dan mudah dipahami?

**Solusi**: Tetapkan tanggung jawab sehingga kohesi tetap tinggi.

**Karakteristik High Cohesion**:
- Kelas memiliki tanggung jawab yang fokus
- Method terkait dengan tujuan kelas
- Perubahan hanya memengaruhi fungsionalitas terkait

**Contoh**: Pisahkan concerns ke dalam kelas berbeda.

```java
// High cohesion - setiap kelas memiliki single responsibility
public class OrderValidator {
    public ValidationResult validate(Order order) { /* ... */ }
}

public class OrderCalculator {
    public Money calculateTotal(Order order) { /* ... */ }
}

public class OrderRepository {
    public void save(Order order) { /* ... */ }
}
```

### 6. Polymorphism
**Masalah**: Bagaimana menangani alternatif berdasarkan tipe?

**Solusi**: Gunakan operasi polimorfik ketika perilaku bervariasi berdasarkan tipe.

**Contoh**: Method pembayaran berbeda mengimplementasikan interface yang sama.

```java
public interface PaymentProcessor {
    PaymentResult process(Payment payment);
}

public class CreditCardProcessor implements PaymentProcessor {
    public PaymentResult process(Payment payment) {
        // Logika spesifik credit card
    }
}

public class PayPalProcessor implements PaymentProcessor {
    public PaymentResult process(Payment payment) {
        // Logika spesifik PayPal
    }
}
```

### 7. Pure Fabrication
**Masalah**: Apa yang harus dilakukan ketika Information Expert tidak mengarah ke high cohesion atau low coupling?

**Solusi**: Buat kelas buatan untuk mencapai desain yang lebih baik.

**Contoh**: Pola Repository untuk akses data.

```java
public class OrderRepository {
    // Pure fabrication - tidak mewakili konsep domain
    // tetapi memberikan high cohesion dan low coupling

    public Order findById(Long id) { /* ... */ }
    public void save(Order order) { /* ... */ }
    public List<Order> findByCustomer(Customer customer) { /* ... */ }
}
```

### 8. Indirection
**Masalah**: Bagaimana mendekopling objek?

**Solusi**: Tetapkan tanggung jawab pada objek perantara untuk memediasi antar objek lain.

**Contoh**: Pola MVC dimana Controller memediasi antara View dan Model.

```java
public class OrderController {
    private OrderService orderService;
    private OrderView orderView;

    public void handleOrderRequest(HttpRequest request) {
        // Controller bertindak sebagai perantara
        Order order = orderService.getOrder(request.getOrderId());
        orderView.render(order);
    }
}
```

### 9. Protected Variations
**Masalah**: Bagaimana mendesain untuk perubahan?

**Solusi**: Identifikasi titik variasi dan buat interface stabil di sekitarnya.

**Contoh**: Pola abstract factory untuk implementasi database berbeda.

```java
public interface DatabaseFactory {
    UserRepository createUserRepository();
    OrderRepository createOrderRepository();
}

public class MySQLDatabaseFactory implements DatabaseFactory {
    // Implementasi spesifik MySQL
}

public class PostgreSQLDatabaseFactory implements DatabaseFactory {
    // Implementasi spesifik PostgreSQL
}
```

## Menerapkan GRASP dalam Praktik

### Proses Desain
1. **Identifikasi Tanggung Jawab**: Apa yang perlu dilakukan?
2. **Identifikasi Information Experts**: Siapa yang memiliki informasi yang diperlukan?
3. **Evaluasi Coupling/Cohesion**: Apakah ini mempertahankan desain yang baik?
4. **Terapkan Pola Lain**: Gunakan pola GoF untuk mengimplementasikan tanggung jawab
5. **Refactor**: Terus tingkatkan desain

### Integrasi Pola Umum

#### GRASP + Pola GoF
- **Creator** → **Factory Pattern**
- **Controller** → **Command Pattern**
- **Polymorphism** → **Strategy Pattern**
- **Pure Fabrication** → **Adapter Pattern**

### Contoh: Pemrosesan Order E-commerce

```java
// Information Expert: Order tahu totalnya
public class Order {
    private List<OrderItem> items;
    private Customer customer;

    public Money getTotal() {
        return items.stream()
                .map(item -> item.getProduct().getPrice().multiply(item.getQuantity()))
                .reduce(Money.zero(), Money::add);
    }
}

// Creator: Order membuat OrderItems
public class Order {
    public OrderItem addItem(Product product, int quantity) {
        OrderItem item = new OrderItem(product, quantity);
        items.add(item);
        return item;
    }
}

// Controller: Controller use case
@RestController
public class OrderController {
    private final PlaceOrderUseCase placeOrderUseCase;

    @PostMapping("/orders")
    public OrderResponse placeOrder(@RequestBody PlaceOrderRequest request) {
        return placeOrderUseCase.execute(request);
    }
}

// Low Coupling: Dependency injection
@Service
public class PlaceOrderUseCase {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;

    public PlaceOrderUseCase(OrderRepository orderRepository, PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
    }
}
```

## Manfaat dan Trade-offs

### Manfaat
- **Penugasan Tanggung Jawab yang Jelas**: Setiap kelas memiliki tanggung jawab yang terdefinisi dengan baik
- **Kode yang Mudah Dipelihara**: Perubahan terlokalisasi dan dapat diprediksi
- **Desain yang Dapat Diuji**: Kelas memiliki tanggung jawab yang fokus
- **Komponen yang Dapat Digunakan Ulang**: Low coupling memungkinkan reuse

### Trade-offs
- **Overhead Desain**: Membutuhkan pemikiran desain di awal
- **Kurva Pembelajaran**: Butuh waktu untuk menguasai penerapan
- **Penerapan Subjektif**: Membutuhkan penilaian desain
- **Risiko Over-engineering**: Dapat mengarah ke kompleksitas yang tidak perlu

## Kesalahan Umum

### Over-application
- **Masalah**: Menerapkan GRASP di mana-mana mengarah ke over-engineering
- **Solusi**: Gunakan penilaian; solusi sederhana sering lebih baik

### Mengabaikan Konteks
- **Masalah**: Menerapkan pola tanpa mempertimbangkan batasan sistem
- **Solusi**: Pertimbangkan performa, keterampilan tim, dan kebutuhan bisnis

### Ketaatan yang Kaku
- **Masalah**: Mengikuti pola secara buta tanpa memahami rationale
- **Solusi**: Pahami mengapa setiap pola ada dan kapan melenturkan aturan

## Tools dan Teknik

### Tools Desain
- **CRC Cards**: Kartu Class-Responsibility-Collaborator untuk desain
- **Sequence Diagrams**: Visualisasikan interaksi objek
- **Class Diagrams**: Dokumentasikan struktur statis

### Tools Kualitas Kode
- **SonarQube**: Metrik kualitas dan maintainability kode
- **Checkstyle**: Tegakkan standar coding
- **PMD**: Analisis kode statis

## Referensi

- [GRASP Patterns - Craig Larman](https://www.craiglarman.com/wiki/index.php?title=GRASP)
- [Applying UML and Patterns - Craig Larman](https://www.amazon.com/Applying-UML-Patterns-Introduction-Object-Oriented/dp/0131489062)
- [Clean Architecture - Robert C. Martin](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)
- [Domain-Driven Design - Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)