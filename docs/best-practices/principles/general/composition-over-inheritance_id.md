# Composition over Inheritance

## Gambaran Umum

Composition over Inheritance adalah prinsip fundamental desain berorientasi objek yang menganjurkan membangun objek kompleks dengan menggabungkan komponen sederhana dan dapat digunakan ulang daripada mengandalkan hierarki inheritance yang dalam. Alih-alih membuat subclass yang mewarisi perilaku dari parent class, composition mendorong perakitan objek dari komponen yang lebih kecil dan fokus yang dapat dicampur dan dicocokkan untuk mencapai fungsionalitas yang diinginkan.

Prinsip ini menghasilkan kode yang lebih mudah dipelihara, fleksibel, dan dapat diuji dengan mempromosikan loose coupling, enkapsulasi yang lebih baik, dan modifikasi perilaku yang lebih mudah pada runtime. Ini sangat berharga dalam bahasa yang mendukung pola composition seperti dependency injection, mixins, dan traits.

## Konsep Inti

### Inheritance vs Composition

#### Pendekatan Inheritance
```java
// Desain berbasis inheritance - hierarki kaku
public class Animal {
    protected void eat() { /* implementation */ }
    protected void sleep() { /* implementation */ }
}

public class Dog extends Animal {
    public void bark() { /* implementation */ }
}

public class Cat extends Animal {
    public void meow() { /* implementation */ }
}

// Masalah: Bagaimana jika kita ingin anjing robot yang tidak makan atau tidur?
// Kita perlu multiple inheritance atau hierarki kompleks
```

#### Pendekatan Composition
```java
// Desain berbasis composition - perakitan fleksibel
public interface Eater {
    void eat();
}

public interface Sleeper {
    void sleep();
}

public interface Barker {
    void bark();
}

public class Dog implements Eater, Sleeper, Barker {
    private final Eater eater;
    private final Sleeper sleeper;
    private final Barker barker;

    public Dog(Eater eater, Sleeper sleeper, Barker barker) {
        this.eater = eater;
        this.sleeper = sleeper;
        this.barker = barker;
    }

    @Override
    public void eat() { eater.eat(); }

    @Override
    public void sleep() { sleeper.sleep(); }

    @Override
    public void bark() { barker.bark(); }
}

// Sekarang kita dapat dengan mudah membuat kombinasi berbeda:
// RoboticDog dengan NullEater, NullSleeper, RealBarker
// WildDog dengan RealEater, RealSleeper, RealBarker
```

### Pola Composition

#### Strategy Pattern
```java
// Composition menggunakan Strategy pattern
public interface PaymentStrategy {
    boolean pay(double amount);
}

public class CreditCardPayment implements PaymentStrategy {
    @Override
    public boolean pay(double amount) {
        // Logika pembayaran kartu kredit
        return true;
    }
}

public class PayPalPayment implements PaymentStrategy {
    @Override
    public boolean pay(double amount) {
        // Logika pembayaran PayPal
        return true;
    }
}

public class ShoppingCart {
    private final PaymentStrategy paymentStrategy;

    public ShoppingCart(PaymentStrategy paymentStrategy) {
        this.paymentStrategy = paymentStrategy;
    }

    public void checkout(double total) {
        if (paymentStrategy.pay(total)) {
            System.out.println("Pembayaran berhasil!");
        }
    }
}

// Penggunaan - dapat mengubah metode pembayaran pada runtime
ShoppingCart cart = new ShoppingCart(new CreditCardPayment());
cart.checkout(100.0);

// Beralih ke PayPal
cart = new ShoppingCart(new PayPalPayment());
cart.checkout(100.0);
```

#### Decorator Pattern
```java
// Composition menggunakan Decorator pattern
public interface DataSource {
    String readData();
    void writeData(String data);
}

public class FileDataSource implements DataSource {
    private final String filename;

    public FileDataSource(String filename) {
        this.filename = filename;
    }

    @Override
    public String readData() {
        // Baca dari file
        return "data dari file";
    }

    @Override
    public void writeData(String data) {
        // Tulis ke file
        System.out.println("Menulis ke file: " + data);
    }
}

public abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrappee;

    public DataSourceDecorator(DataSource source) {
        this.wrappee = source;
    }
}

public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource source) {
        super(source);
    }

    @Override
    public String readData() {
        String data = wrappee.readData();
        return decrypt(data);
    }

    @Override
    public void writeData(String data) {
        String encrypted = encrypt(data);
        wrappee.writeData(encrypted);
    }

    private String encrypt(String data) { return "encrypted:" + data; }
    private String decrypt(String data) { return data.replace("encrypted:", ""); }
}

public class CompressionDecorator extends DataSourceDecorator {
    public CompressionDecorator(DataSource source) {
        super(source);
    }

    @Override
    public String readData() {
        String data = wrappee.readData();
        return decompress(data);
    }

    @Override
    public void writeData(String data) {
        String compressed = compress(data);
        wrappee.writeData(compressed);
    }

    private String compress(String data) { return "compressed:" + data; }
    private String decompress(String data) { return data.replace("compressed:", ""); }
}

// Penggunaan - compose perilaku secara dinamis
DataSource source = new FileDataSource("data.txt");
DataSource encrypted = new EncryptionDecorator(source);
DataSource encryptedCompressed = new CompressionDecorator(encrypted);
```

## Strategi Implementasi

### Dependency Injection
```java
// Composition melalui dependency injection
public interface Logger {
    void log(String message);
}

public interface Database {
    void save(String data);
}

public class UserService {
    private final Logger logger;
    private final Database database;

    // Constructor injection
    public UserService(Logger logger, Database database) {
        this.logger = logger;
        this.database = database;
    }

    public void createUser(String userData) {
        logger.log("Creating user: " + userData);
        database.save(userData);
        logger.log("User created successfully");
    }
}

// Konfigurasi
public class AppConfig {
    @Bean
    public Logger consoleLogger() {
        return new ConsoleLogger();
    }

    @Bean
    public Database mysqlDatabase() {
        return new MySQLDatabase();
    }

    @Bean
    public UserService userService(Logger logger, Database database) {
        return new UserService(logger, database);
    }
}
```

### Mixins dan Traits
```javascript
// JavaScript mixins untuk composition
const canEat = {
    eat() {
        console.log(`${this.name} is eating`);
    }
};

const canSleep = {
    sleep() {
        console.log(`${this.name} is sleeping`);
    }
};

const canFly = {
    fly() {
        console.log(`${this.name} is flying`);
    }
};

// Fungsi mixin
function mixin(target, ...sources) {
    Object.assign(target, ...sources);
    return target;
}

// Buat kombinasi berbeda
class Animal {
    constructor(name) {
        this.name = name;
    }
}

const Dog = mixin(class extends Animal {}, canEat, canSleep);
const Bird = mixin(class extends Animal {}, canEat, canSleep, canFly);

// Penggunaan
const dog = new Dog("Buddy");
dog.eat();   // Buddy is eating
dog.sleep(); // Buddy is sleeping
// dog.fly(); // Error - tidak ada method fly

const bird = new Bird("Tweety");
bird.eat();   // Tweety is eating
bird.sleep(); // Tweety is sleeping
bird.fly();   // Tweety is flying
```

### Functional Composition
```javascript
// Functional composition di JavaScript
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const add = x => y => x + y;
const multiply = x => y => x * y;
const subtract = x => y => x - y;

// Compose fungsi
const calculatePrice = pipe(
    add(10),      // Tambah harga dasar
    multiply(1.1), // Tambah pajak
    subtract(5)   // Terapkan diskon
);

console.log(calculatePrice(100)); // ((100 + 10) * 1.1) - 5 = 110

// Dalam konteks yang lebih object-oriented
class PriceCalculator {
    constructor(...operations) {
        this.operations = operations;
    }

    calculate(basePrice) {
        return this.operations.reduce((price, op) => op(price), basePrice);
    }
}

const calculator = new PriceCalculator(
    price => price + 10,    // Tambah ongkir
    price => price * 1.08,  // Tambah pajak
    price => price - 5      // Terapkan diskon
);

console.log(calculator.calculate(100)); // 113
```

## Composition over Inheritance dalam Praktik

### Contoh GUI Framework
```java
// Composition dalam GUI framework
public interface Component {
    void render();
    void handleEvent(Event event);
}

public interface Clickable {
    void onClick(Runnable action);
}

public interface Hoverable {
    void onHover(Runnable action);
}

public class Button implements Component, Clickable, Hoverable {
    private final Component baseComponent;
    private final Clickable clickableBehavior;
    private final Hoverable hoverableBehavior;

    public Button(Component base, Clickable clickable, Hoverable hoverable) {
        this.baseComponent = base;
        this.clickableBehavior = clickable;
        this.hoverableBehavior = hoverable;
    }

    @Override
    public void render() {
        baseComponent.render();
    }

    @Override
    public void handleEvent(Event event) {
        baseComponent.handleEvent(event);
        clickableBehavior.onClick(() -> System.out.println("Button diklik"));
        hoverableBehavior.onHover(() -> System.out.println("Button dihover"));
    }

    @Override
    public void onClick(Runnable action) {
        clickableBehavior.onClick(action);
    }

    @Override
    public void onHover(Runnable action) {
        hoverableBehavior.onHover(action);
    }
}

// Penggunaan - buat tipe button berbeda
Component textButton = new Button(
    new TextComponent("Klik saya"),
    new SimpleClickable(),
    new SimpleHoverable()
);

Component imageButton = new Button(
    new ImageComponent("button.png"),
    new SimpleClickable(),
    new TooltipHoverable("Ini adalah image button")
);
```

### Contoh Game Development
```csharp
// Composition dalam pengembangan game
public interface IWeapon {
    void Fire();
}

public interface IMovement {
    void Move(Vector3 direction);
}

public interface IHealth {
    void TakeDamage(float damage);
    bool IsAlive();
}

public class Player {
    public IWeapon Weapon { get; set; }
    public IMovement Movement { get; set; }
    public IHealth Health { get; set; }

    public void Update() {
        // Handle input
        if (Input.GetKey(KeyCode.W)) {
            Movement.Move(Vector3.forward);
        }

        if (Input.GetMouseButtonDown(0)) {
            Weapon.Fire();
        }
    }
}

// Konfigurasi player berbeda
public class AssaultPlayer : Player {
    public AssaultPlayer() {
        Weapon = new AssaultRifle();
        Movement = new GroundMovement();
        Health = new StandardHealth(100);
    }
}

public class SniperPlayer : Player {
    public SniperPlayer() {
        Weapon = new SniperRifle();
        Movement = new GroundMovement();
        Health = new StandardHealth(80); // Sniper lebih rapuh
    }
}

public class FlyingPlayer : Player {
    public FlyingPlayer() {
        Weapon = new LaserGun();
        Movement = new FlyingMovement();
        Health = new ArmoredHealth(150); // Unit terbang lebih tangguh
    }
}
```

### Contoh Web Service
```java
// Composition dalam web services
public interface Serializer {
    String serialize(Object data);
}

public interface Cache {
    Object get(String key);
    void put(String key, Object value);
}

public interface Metrics {
    void recordRequest(String endpoint, long duration);
}

public class ApiService {
    private final Serializer serializer;
    private final Cache cache;
    private final Metrics metrics;

    public ApiService(Serializer serializer, Cache cache, Metrics metrics) {
        this.serializer = serializer;
        this.cache = cache;
        this.metrics = metrics;
    }

    public String getUserData(String userId) {
        long startTime = System.currentTimeMillis();

        try {
            // Coba cache dulu
            Object cached = cache.get("user:" + userId);
            if (cached != null) {
                return serializer.serialize(cached);
            }

            // Ambil dari database
            Object userData = fetchFromDatabase(userId);

            // Cache hasilnya
            cache.put("user:" + userId, userData);

            return serializer.serialize(userData);

        } finally {
            long duration = System.currentTimeMillis() - startTime;
            metrics.recordRequest("/api/users/" + userId, duration);
        }
    }
}

// Konfigurasi service berbeda
public class ProductionApiService extends ApiService {
    public ProductionApiService() {
        super(
            new JsonSerializer(),
            new RedisCache(),
            new PrometheusMetrics()
        );
    }
}

public class TestApiService extends ApiService {
    public TestApiService() {
        super(
            new JsonSerializer(),
            new InMemoryCache(),
            new NoOpMetrics()
        );
    }
}
```

## Manfaat dan Trade-off

### Keuntungan Composition

#### Fleksibilitas dan Reusability
```java
// Mudah membuat kombinasi baru
public class RobotDog {
    private final Barker barker;
    private final Walker walker;

    public RobotDog() {
        this.barker = new MechanicalBarker();
        this.walker = new WheeledWalker();
    }

    public void bark() { barker.bark(); }
    public void walk() { walker.walk(); }
}

public class OrganicDog {
    private final Barker barker;
    private final Walker walker;
    private final Eater eater;

    public OrganicDog() {
        this.barker = new OrganicBarker();
        this.walker = new LeggedWalker();
        this.eater = new MeatEater();
    }

    public void bark() { barker.bark(); }
    public void walk() { walker.walk(); }
    public void eat() { eater.eat(); }
}
```

#### Testability
```java
// Mudah test dengan mocks/stubs
public class UserServiceTest {

    @Test
    public void shouldCreateUserSuccessfully() {
        // Arrange
        Logger mockLogger = mock(Logger.class);
        Database mockDatabase = mock(Database.class);
        UserService service = new UserService(mockLogger, mockDatabase);

        // Act
        service.createUser("user data");

        // Assert
        verify(mockLogger).log("Creating user: user data");
        verify(mockDatabase).save("user data");
        verify(mockLogger).log("User created successfully");
    }
}
```

#### Perubahan Perilaku pada Runtime
```java
// Ubah perilaku pada runtime
public class DynamicVehicle {
    private Engine engine;

    public void setEngine(Engine engine) {
        this.engine = engine;
    }

    public void drive() {
        engine.start();
        // logika drive
    }
}

// Penggunaan
DynamicVehicle car = new DynamicVehicle();
car.setEngine(new GasolineEngine());  // Mulai dengan mesin bensin
car.drive();

car.setEngine(new ElectricEngine());  // Beralih ke elektrik pada runtime
car.drive();
```

### Kekurangan Composition

#### Kode Boilerplate
```java
// Lebih banyak kode untuk ditulis dibanding inheritance
public class ComposedClass {
    private final Component1 comp1;
    private final Component2 comp2;
    private final Component3 comp3;

    public ComposedClass(Component1 comp1, Component2 comp2, Component3 comp3) {
        this.comp1 = comp1;
        this.comp2 = comp2;
        this.comp3 = comp3;
    }

    public void method1() { comp1.method1(); }
    public void method2() { comp2.method2(); }
    public void method3() { comp3.method3(); }
}
```

#### Kompleksitas dalam Assembly
```java
// Graf dependency kompleks
@Configuration
public class ComplexConfig {

    @Bean
    public ServiceA serviceA(ServiceB b, ServiceC c) {
        return new ServiceA(b, c);
    }

    @Bean
    public ServiceB serviceB(ServiceD d, ServiceE e) {
        return new ServiceB(d, e);
    }

    @Bean
    public ServiceC serviceC(ServiceF f) {
        return new ServiceC(f);
    }

    // Banyak definisi bean lagi...
}
```

## Kapan Menggunakan Composition vs Inheritance

### Gunakan Inheritance Ketika:
- **Relasi IS-A**: Subclass benar-benar versi specialized dari parent class
- **Implementasi Bersama**: Subclass berbagi implementasi umum yang signifikan
- **Polymorphism**: Anda perlu polymorphism runtime berdasarkan tipe
- **Hierarki Sederhana**: Pohon inheritance dangkal dan stabil

### Gunakan Composition Ketika:
- **Relasi HAS-A**: Class berisi komponen yang menyediakan fungsionalitas
- **Fleksibilitas Runtime**: Anda perlu mengubah perilaku secara dinamis
- **Multiple Behaviors**: Class perlu perilaku dari multiple sumber
- **Testability**: Anda ingin mudah mock atau stub dependencies
- **Hierarki Kompleks**: Pohon inheritance dalam yang menjadi fragile

### Pendekatan Hibrid
```java
// Kadang keduanya sesuai
public abstract class BaseEntity {
    protected Long id;
    protected LocalDateTime createdAt;

    // Perilaku entity umum
    public boolean isNew() {
        return id == null;
    }
}

public class User extends BaseEntity {
    // Field spesifik User

    // Perilaku yang dikomposisi
    private final PasswordEncoder encoder;
    private final Validator validator;

    public User(PasswordEncoder encoder, Validator validator) {
        this.encoder = encoder;
        this.validator = validator;
    }

    // Gunakan inheritance untuk identity/perilaku
    // Gunakan composition untuk dependencies
}
```

## Tools dan Framework

### Dependency Injection Framework
- **Spring Framework**: Dukungan DI ekstensif dengan @Autowired, @Inject
- **Guice**: Framework DI ringan dari Google
- **Dagger**: DI compile-time untuk Android/Java
- **InversifyJS**: DI container untuk TypeScript/JavaScript

### Library Composition
- **Lodash**: Utility composition fungsional
- **Ramda**: Library pemrograman fungsional dengan composition
- **Mixin libraries**: Traits.js, mixwith.js untuk JavaScript
- **Scala traits**: Mekanisme composition built-in

### Testing Framework
- **Mockito**: Framework mocking untuk Java
- **Jest**: Framework testing dengan kemampuan mocking
- **Test doubles**: Library untuk membuat test doubles

## Anti-Pola

### Anti-Pola Inheritance yang Harus Dihindari
- **Hierarki Inheritance Dalam**: Class dengan banyak level inheritance
- **Fragile Base Class**: Mengubah parent class merusak subclass
- **Masalah Multiple Inheritance**: Diamond problem di bahasa yang mendukungnya
- **Inheritance untuk Code Reuse**: Menggunakan inheritance hanya untuk berbagi kode

### Anti-Pola Composition yang Harus Dihindari
- **Over-Composition**: Memecah segalanya menjadi komponen kecil yang tidak perlu
- **Circular Dependencies**: Komponen yang saling bergantung
- **God Object**: Class yang mengkomposisi terlalu banyak tanggung jawab
- **Konfigurasi Kompleks**: Konfigurasi DI menjadi tidak maintainable

## Referensi

- [Composition over Inheritance - Gang of Four](https://en.wikipedia.org/wiki/Composition_over_inheritance)
- [Effective Java - Joshua Bloch](https://www.amazon.com/Effective-Java-Joshua-Bloch/dp/0134685997)
- [Design Patterns - Gang of Four](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)
- [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Head First Design Patterns](https://www.amazon.com/Head-First-Design-Patterns-Object-Oriented/dp/0596007124)
- [Dependency Injection - Martin Fowler](https://martinfowler.com/articles/injection.html)