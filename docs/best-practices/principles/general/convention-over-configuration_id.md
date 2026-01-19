# Convention over Configuration

## Gambaran Umum

Convention over Configuration (CoC) adalah paradigma desain perangkat lunak yang menekankan default yang masuk akal dan konvensi yang mapan daripada konfigurasi eksplisit. Alih-alih mengharuskan developer menentukan setiap detail tentang bagaimana komponen harus dihubungkan, CoC mengasumsikan bahwa developer akan mengikuti pola umum dan menyediakan konfigurasi otomatis berdasarkan konvensi ini.

Prinsip ini secara signifikan mengurangi kode boilerplate dan file konfigurasi, memungkinkan developer fokus pada logika bisnis daripada setup infrastruktur. CoC sangat lazim di framework seperti Ruby on Rails, Spring Boot, dan ASP.NET Core, di mana hal ini memungkinkan pengembangan aplikasi yang cepat melalui default yang opinionated.

## Konsep Inti

### Filosofi CoC

#### Default yang Masuk Akal
- **Definisi**: Pengaturan yang telah ditetapkan sebelumnya yang bekerja untuk sebagian besar kasus penggunaan
- **Tujuan**: Menghilangkan paralisis keputusan dan mengurangi waktu setup
- **Contoh**: Nomor port default, lokasi file, pola penamaan
- **Manfaat**: Onboarding lebih cepat, struktur proyek yang konsisten

#### Pola Konvensi
- **Konvensi Penamaan**: Nama class memetakan ke tabel database, URL memetakan ke controller
- **Struktur Direktori**: Layout folder standar untuk tipe komponen berbeda
- **Organisasi File**: Lokasi yang diharapkan untuk konfigurasi, aset, dan kode
- **Asumsi Perilaku**: Perilaku default untuk operasi umum

#### Override Konfigurasi
- **Escape Hatch**: Kemampuan untuk override konvensi ketika diperlukan
- **Konfigurasi Eksplisit**: Mekanisme override untuk kasus khusus
- **Kustomisasi Bertahap**: Mulai dengan konvensi, kustomisasi sesuai kebutuhan
- **Dokumentasi**: Panduan yang jelas tentang cara override default

### CoC vs Konfigurasi

#### Pendekatan Konfigurasi Tradisional
```xml
<!-- Konfigurasi XML tradisional - verbose dan rawan kesalahan -->
<bean id="userService" class="com.example.UserService">
    <property name="userRepository" ref="userRepository"/>
    <property name="passwordEncoder" ref="passwordEncoder"/>
    <property name="emailService" ref="emailService"/>
</bean>

<bean id="userRepository" class="com.example.UserRepository">
    <property name="dataSource" ref="dataSource"/>
    <property name="entityClass" value="com.example.User"/>
</bean>

<bean id="passwordEncoder" class="org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder">
    <constructor-arg value="10"/>
</bean>
```

#### Pendekatan Convention over Configuration
```java
// Spring Boot dengan CoC - konfigurasi minimal diperlukan
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Dependency otomatis diinjeksi berdasarkan konvensi penamaan
    public UserService(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }
}
```

## Strategi Implementasi

### Desain Framework dengan CoC

#### Discovery Komponen
```java
// Component scanning berbasis konvensi
@Configuration
@ComponentScan(basePackages = "com.example")
public class AppConfig {
    // Tidak perlu definisi bean eksplisit
    // Framework otomatis menemukan class @Service, @Repository, @Controller
}

// Konvensi: Class di package tertentu diperlakukan sebagai tipe tertentu
// com.example.service.* -> bean @Service
// com.example.repository.* -> bean @Repository
// com.example.controller.* -> bean @Controller
```

#### Konvensi Penamaan
```java
// Konvensi penamaan Ruby on Rails
public class UserController {
    // Konvensi: UserController memetakan ke route /users
    // method index() memetakan ke GET /users
    // method show(id) memetakan ke GET /users/:id
    // method create() memetakan ke POST /users
    // method update(id) memetakan ke PUT /users/:id
    // method delete(id) memetakan ke DELETE /users/:id
}

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Konvensi: Nama method generate query otomatis
    // findByEmail(String email) -> SELECT * FROM user WHERE email = ?
    // findByLastNameAndFirstName -> SELECT * FROM user WHERE last_name = ? AND first_name = ?
}
```

#### Konvensi Struktur Direktori
```
src/
├── main/
│   ├── java/
│   │   └── com/example/
│   │       ├── controller/     # Konvensi: Controller di sini
│   │       ├── service/        # Konvensi: Logika bisnis di sini
│   │       ├── repository/     # Konvensi: Akses data di sini
│   │       ├── model/          # Konvensi: Model domain di sini
│   │       └── config/         # Konvensi: Konfigurasi di sini
│   └── resources/
│       ├── static/             # Konvensi: Aset statis
│       ├── templates/          # Konvensi: Template view
│       └── application.yml     # Konvensi: File config utama
└── test/
    └── java/
        └── com/example/
            └── controller/     # Konvensi: Test mencerminkan struktur source
```

### Mengimplementasikan CoC di Framework Custom

#### Registry Konvensi
```java
// Registry konvensi untuk framework custom
public class ConventionRegistry {

    private final Map<Class<?>, Convention<?>> conventions = new HashMap<>();

    public <T> void registerConvention(Class<T> type, Convention<T> convention) {
        conventions.put(type, convention);
    }

    public <T> T applyConvention(Class<T> type, Object context) {
        Convention<T> convention = conventions.get(type);
        if (convention != null) {
            return convention.apply(context);
        }
        throw new ConventionNotFoundException("Tidak ada konvensi untuk tipe: " + type);
    }
}

// Penggunaan
ConventionRegistry registry = new ConventionRegistry();
registry.registerConvention(Controller.class,
    context -> new ControllerMapping("/" + context.getClass().getSimpleName().toLowerCase()));
```

#### Discovery Konvensi
```java
// Discovery konvensi otomatis
public class ConventionScanner {

    public List<ConventionCandidate> scanPackage(String packageName) {
        List<ConventionCandidate> candidates = new ArrayList<>();

        // Scan classpath untuk class
        Reflections reflections = new Reflections(packageName);

        // Temukan class yang mengikuti konvensi penamaan
        Set<Class<?>> services = reflections.getTypesAnnotatedWith(Service.class);
        Set<Class<?>> repositories = reflections.getTypesAnnotatedWith(Repository.class);

        // Terapkan konvensi otomatis
        for (Class<?> serviceClass : services) {
            candidates.add(new ConventionCandidate(serviceClass, ConventionType.SERVICE));
        }

        for (Class<?> repoClass : repositories) {
            candidates.add(new ConventionCandidate(repoClass, ConventionType.REPOSITORY));
        }

        return candidates;
    }
}
```

## Convention over Configuration dalam Praktik

### Contoh Ruby on Rails
```ruby
# Controller Rails dengan CoC penuh
class UsersController < ApplicationController
  # Konvensi: Inherits dari ApplicationController
  # Konvensi: Otomatis memetakan ke route /users
  # Konvensi: Otomatis menggunakan model User
  # Konvensi: Otomatis render view dari app/views/users/

  def index
    # Konvensi: Variable instance @users tersedia di view
    @users = User.all
  end

  def show
    # Konvensi: params[:id] berisi ID
    @user = User.find(params[:id])
  end

  def create
    # Konvensi: params[:user] berisi data form
    @user = User.new(user_params)

    if @user.save
      # Konvensi: Redirect ke halaman show user
      redirect_to @user
    else
      # Konvensi: Render form baru dengan error
      render :new
    end
  end

  private

  def user_params
    # Konvensi: Strong parameters untuk keamanan
    params.require(:user).permit(:name, :email, :password)
  end
end
```

### Contoh Spring Boot
```java
// Spring Boot dengan CoC ekstensif
@SpringBootApplication  // Konvensi: Mengaktifkan auto-configuration
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // Konvensi: Scan komponen di package yang sama dan subpackage
        // Konvensi: Mulai web server embedded di port 8080
        // Konvensi: Konfigurasi koneksi database dari application.properties
    }
}

@RestController  // Konvensi: Semua method return JSON secara default
@RequestMapping("/api/users")  // Konvensi: Map ke /api/users
public class UserController {

    private final UserService userService;

    // Konvensi: Constructor injection, tidak perlu @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping  // Konvensi: Map ke GET /api/users
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @PostMapping  // Konvensi: Map ke POST /api/users
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }
}

@Service  // Konvensi: Register sebagai Spring bean
@Transactional  // Konvensi: Semua method transactional
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Konvensi: Method otomatis transactional
    public User save(User user) {
        return userRepository.save(user);
    }
}

@Repository  // Konvensi: Register sebagai Spring Data repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Konvensi: Operasi CRUD basic disediakan otomatis
    // Konvensi: Method custom digenerate dari nama
    List<User> findByEmail(String email);
    List<User> findByStatusAndCreatedDateAfter(UserStatus status, LocalDate date);
}
```

### Contoh ASP.NET Core
```csharp
// ASP.NET Core MVC dengan CoC
[ApiController]  // Konvensi: Perilaku API controller
[Route("api/[controller]")]  // Konvensi: Route berdasarkan nama controller
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    // Konvensi: Dependency injection via constructor
    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]  // Konvensi: Map ke GET
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);  // Konvensi: Return JSON
    }

    [HttpGet("{id}")]  // Konvensi: Route parameter binding
    public async Task<ActionResult<User>> GetUser(int id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null)
        {
            return NotFound();  // Konvensi: HTTP response standar
        }
        return Ok(user);
    }
}

// Konvensi: Penamaan interface (prefix I)
public interface IUserService
{
    Task<IEnumerable<User>> GetAllAsync();
    Task<User> GetByIdAsync(int id);
}

[Service(ServiceLifetime.Scoped)]  // Konvensi: Registrasi DI
public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;  // Konvensi: EF Core context injection
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        // Konvensi: Penamaan DbSet property (Users untuk entity User)
        return await _context.Users.ToListAsync();
    }
}
```

## Mekanisme Override Konfigurasi

### Konfigurasi Eksplisit
```java
// Override CoC ketika diperlukan
@Configuration
public class CustomConfig {

    @Bean
    @Primary  // Override konvensi
    public PasswordEncoder customPasswordEncoder() {
        // Password encoder custom alih-alih default BCrypt
        return new SCryptPasswordEncoder();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        // Override konvensi CORS
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("https://example.com")
                        .allowedMethods("GET", "POST", "PUT", "DELETE");
            }
        };
    }
}
```

### Properti Konfigurasi
```yaml
# application.yml - Override konvensi Spring Boot
server:
  port: 9090  # Override port default 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/myapp  # Override default H2
    username: myuser
    password: mypass

  jpa:
    hibernate:
      ddl-auto: validate  # Override default create-drop

logging:
  level:
    com.example: DEBUG  # Override default INFO
```

## Praktik Terbaik

### Dokumentasi dan Komunikasi
- **Dokumentasi Konvensi**: Dokumentasikan dengan jelas semua konvensi yang digunakan di framework
- **Panduan Migrasi**: Sediakan panduan untuk override konvensi
- **Alignment Tim**: Pastikan tim memahami dan setuju dengan konvensi
- **Code Reviews**: Periksa bahwa konvensi diikuti dengan tepat

### Menyeimbangkan CoC dengan Fleksibilitas
- **Progressive Disclosure**: Mulai dengan konvensi, izinkan kustomisasi sesuai kebutuhan
- **Konfigurasi sebagai Kode**: Gunakan bahasa pemrograman untuk konfigurasi kompleks
- **Testing Konvensi**: Test bahwa konvensi bekerja sesuai harapan
- **Pola Override**: Sediakan pola yang jelas untuk ketika konvensi tidak cocok

### Kesalahan Umum
- **Ketergantungan Berlebihan pada Magic**: Konvensi harus dapat ditemukan dan predictable
- **Framework yang Tidak Fleksibel**: Izinkan override yang reasonable tanpa kompleksitas
- **Konvensi yang Tidak Terdukumentasi**: Selalu dokumentasikan konvensi dan rationale-nya
- **Breaking Changes**: Pertimbangkan backward compatibility ketika mengubah konvensi

## Tools dan Framework

### Framework CoC Penuh
- **Ruby on Rails**: Framework CoC original
- **Spring Boot**: Auto-configuration ekstensif
- **ASP.NET Core**: MVC berbasis konvensi
- **Laravel**: Framework PHP dengan konvensi kuat
- **Django**: Framework web Python dengan konvensi eksplisit

### Library Konvensi
- **Spring Boot Auto-Configuration**: Library konvensi ekstensif
- **Rails Conventions**: Sistem konvensi komprehensif
- **Entity Framework Conventions**: Konvensi mapping database
- **Flask-Classy**: Ekstensi Flask berbasis konvensi

### Code Generators
- **Rails Generators**: Generate kode mengikuti konvensi
- **Spring Boot CLI**: Generate proyek dengan konvensi
- **Yeoman**: Generator proyek JavaScript dengan konvensi
- **Maven Archetypes**: Template proyek dengan konvensi

## Anti-Pola

### Anti-Pola Convention over Configuration
- **Konfigurasi oleh Konvensi Saja**: Tidak ada cara untuk override ketika konvensi tidak cocok
- **Magic Tanpa Dokumentasi**: Konvensi yang tidak dapat ditemukan
- **Konvensi Inkonsisten**: Konvensi berbeda untuk hal yang mirip
- **Merusak Konvensi secara Silent**: Mengubah konvensi tanpa migration path

### Kapan Tidak Menggunakan CoC
- **Sistem Highly Specialized**: Di mana konvensi tidak berlaku
- **Integrasi Legacy**: Ketika sistem existing tidak mengikuti konvensi
- **Konfigurasi Security-Critical**: Di mana konfigurasi eksplisit lebih aman
- **Kebutuhan Highly Dynamic**: Di mana konvensi berubah secara frequent

## Referensi

- [Convention over Configuration - Martin Fowler](https://martinfowler.com/bliki/ConventionOverConfiguration.html)
- [Rails Doctrine - DHH](https://rubyonrails.org/doctrine/)
- [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Twelve-Factor App - Configuration](https://12factor.net/config)
- [The Pragmatic Programmer - Convention vs Configuration](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/)