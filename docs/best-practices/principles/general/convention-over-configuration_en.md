# Convention over Configuration

## Overview

Convention over Configuration (CoC) is a software design paradigm that emphasizes sensible defaults and established conventions over explicit configuration. Instead of requiring developers to specify every detail of how components should be wired together, CoC assumes that developers will follow common patterns and provides automatic configuration based on these conventions.

This principle significantly reduces boilerplate code and configuration files, allowing developers to focus on business logic rather than infrastructure setup. CoC is particularly prevalent in frameworks like Ruby on Rails, Spring Boot, and ASP.NET Core, where it enables rapid application development through opinionated defaults.

## Core Concepts

### The CoC Philosophy

#### Sensible Defaults
- **Definition**: Pre-established settings that work for most use cases
- **Purpose**: Eliminate decision paralysis and reduce setup time
- **Examples**: Default port numbers, file locations, naming patterns
- **Benefits**: Faster onboarding, consistent project structure

#### Convention Patterns
- **Naming Conventions**: Class names map to database tables, URLs map to controllers
- **Directory Structure**: Standard folder layouts for different component types
- **File Organization**: Expected locations for configuration, assets, and code
- **Behavior Assumptions**: Default behaviors for common operations

#### Configuration Override
- **Escape Hatch**: Ability to override conventions when needed
- **Explicit Configuration**: Override mechanisms for special cases
- **Gradual Customization**: Start with conventions, customize as needed
- **Documentation**: Clear guidance on how to override defaults

### CoC vs Configuration

#### Traditional Configuration Approach
```xml
<!-- Traditional XML configuration - verbose and error-prone -->
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

#### Convention over Configuration Approach
```java
// Spring Boot with CoC - minimal configuration needed
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Dependencies automatically injected by naming conventions
    public UserService(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }
}
```

## Implementation Strategies

### Framework Design with CoC

#### Component Discovery
```java
// Convention-based component scanning
@Configuration
@ComponentScan(basePackages = "com.example")
public class AppConfig {
    // No explicit bean definitions needed
    // Framework discovers @Service, @Repository, @Controller classes automatically
}

// Convention: Classes in specific packages are treated as specific types
// com.example.service.* -> @Service beans
// com.example.repository.* -> @Repository beans
// com.example.controller.* -> @Controller beans
```

#### Naming Conventions
```java
// Ruby on Rails naming conventions
public class UserController {
    // Convention: UserController maps to /users route
    // index() method maps to GET /users
    // show(id) maps to GET /users/:id
    // create() maps to POST /users
    // update(id) maps to PUT /users/:id
    // delete(id) maps to DELETE /users/:id
}

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Convention: Method names generate queries automatically
    // findByEmail(String email) -> SELECT * FROM user WHERE email = ?
    // findByLastNameAndFirstName -> SELECT * FROM user WHERE last_name = ? AND first_name = ?
}
```

#### Directory Structure Conventions
```
src/
├── main/
│   ├── java/
│   │   └── com/example/
│   │       ├── controller/     # Convention: Controllers go here
│   │       ├── service/        # Convention: Business logic here
│   │       ├── repository/     # Convention: Data access here
│   │       ├── model/          # Convention: Domain models here
│   │       └── config/         # Convention: Configuration here
│   └── resources/
│       ├── static/             # Convention: Static assets
│       ├── templates/          # Convention: View templates
│       └── application.yml     # Convention: Main config file
└── test/
    └── java/
        └── com/example/
            └── controller/     # Convention: Tests mirror source structure
```

### Implementing CoC in Custom Frameworks

#### Convention Registry
```java
// Convention registry for custom framework
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
        throw new ConventionNotFoundException("No convention for type: " + type);
    }
}

// Usage
ConventionRegistry registry = new ConventionRegistry();
registry.registerConvention(Controller.class,
    context -> new ControllerMapping("/" + context.getClass().getSimpleName().toLowerCase()));
```

#### Convention Discovery
```java
// Automatic convention discovery
public class ConventionScanner {

    public List<ConventionCandidate> scanPackage(String packageName) {
        List<ConventionCandidate> candidates = new ArrayList<>();

        // Scan classpath for classes
        Reflections reflections = new Reflections(packageName);

        // Find classes following naming conventions
        Set<Class<?>> services = reflections.getTypesAnnotatedWith(Service.class);
        Set<Class<?>> repositories = reflections.getTypesAnnotatedWith(Repository.class);

        // Apply conventions automatically
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

## Convention over Configuration in Practice

### Ruby on Rails Example
```ruby
# Rails controller with full CoC
class UsersController < ApplicationController
  # Convention: Inherits from ApplicationController
  # Convention: Maps to /users routes automatically
  # Convention: Uses User model automatically
  # Convention: Renders views from app/views/users/ automatically

  def index
    # Convention: @users instance variable available in view
    @users = User.all
  end

  def show
    # Convention: params[:id] contains the ID
    @user = User.find(params[:id])
  end

  def create
    # Convention: params[:user] contains form data
    @user = User.new(user_params)

    if @user.save
      # Convention: Redirect to user show page
      redirect_to @user
    else
      # Convention: Render new form with errors
      render :new
    end
  end

  private

  def user_params
    # Convention: Strong parameters for security
    params.require(:user).permit(:name, :email, :password)
  end
end
```

### Spring Boot Example
```java
// Spring Boot with extensive CoC
@SpringBootApplication  // Convention: Enables auto-configuration
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // Convention: Scans for components in same package and subpackages
        // Convention: Starts embedded web server on port 8080
        // Convention: Configures database connection from application.properties
    }
}

@RestController  // Convention: All methods return JSON by default
@RequestMapping("/api/users")  // Convention: Maps to /api/users
public class UserController {

    private final UserService userService;

    // Convention: Constructor injection, no @Autowired needed
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping  // Convention: Maps to GET /api/users
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @PostMapping  // Convention: Maps to POST /api/users
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }
}

@Service  // Convention: Registers as Spring bean
@Transactional  // Convention: All methods are transactional
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Convention: Methods are automatically transactional
    public User save(User user) {
        return userRepository.save(user);
    }
}

@Repository  // Convention: Registers as Spring Data repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Convention: Basic CRUD operations provided automatically
    // Convention: Custom methods generated from names
    List<User> findByEmail(String email);
    List<User> findByStatusAndCreatedDateAfter(UserStatus status, LocalDate date);
}
```

### ASP.NET Core Example
```csharp
// ASP.NET Core MVC with CoC
[ApiController]  // Convention: API controller behavior
[Route("api/[controller]")]  // Convention: Route based on controller name
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    // Convention: Dependency injection via constructor
    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]  // Convention: Maps to GET
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);  // Convention: Returns JSON
    }

    [HttpGet("{id}")]  // Convention: Route parameter binding
    public async Task<ActionResult<User>> GetUser(int id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null)
        {
            return NotFound();  // Convention: Standard HTTP responses
        }
        return Ok(user);
    }
}

// Convention: Interface naming (I prefix)
public interface IUserService
{
    Task<IEnumerable<User>> GetAllAsync();
    Task<User> GetByIdAsync(int id);
}

[Service(ServiceLifetime.Scoped)]  // Convention: DI registration
public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;  // Convention: EF Core context injection
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        // Convention: DbSet property naming (Users for User entity)
        return await _context.Users.ToListAsync();
    }
}
```

## Configuration Override Mechanisms

### Explicit Configuration
```java
// Overriding CoC when needed
@Configuration
public class CustomConfig {

    @Bean
    @Primary  // Override convention
    public PasswordEncoder customPasswordEncoder() {
        // Custom password encoder instead of default BCrypt
        return new SCryptPasswordEncoder();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        // Override CORS convention
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

### Configuration Properties
```yaml
# application.yml - Overriding Spring Boot conventions
server:
  port: 9090  # Override default port 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/myapp  # Override H2 default
    username: myuser
    password: mypass

  jpa:
    hibernate:
      ddl-auto: validate  # Override create-drop default

logging:
  level:
    com.example: DEBUG  # Override INFO default
```

## Best Practices

### Documentation and Communication
- **Document Conventions**: Clearly document all conventions used in the framework
- **Migration Guides**: Provide guides for overriding conventions
- **Team Alignment**: Ensure team understands and agrees on conventions
- **Code Reviews**: Check that conventions are followed appropriately

### Balancing CoC with Flexibility
- **Progressive Disclosure**: Start with conventions, allow customization as needed
- **Configuration as Code**: Use programming languages for complex configuration
- **Convention Testing**: Test that conventions work as expected
- **Override Patterns**: Provide clear patterns for when conventions don't fit

### Common Pitfalls
- **Over-Reliance on Magic**: Conventions should be discoverable and predictable
- **Inflexible Frameworks**: Allow reasonable overrides without complexity
- **Undocumented Conventions**: Always document conventions and their rationale
- **Breaking Changes**: Consider backward compatibility when changing conventions

## Tools and Frameworks

### Full CoC Frameworks
- **Ruby on Rails**: The original CoC framework
- **Spring Boot**: Extensive auto-configuration
- **ASP.NET Core**: Convention-based MVC
- **Laravel**: PHP framework with strong conventions
- **Django**: Python web framework with explicit conventions

### Convention Libraries
- **Spring Boot Auto-Configuration**: Extensive convention library
- **Rails Conventions**: Comprehensive convention system
- **Entity Framework Conventions**: Database mapping conventions
- **Flask-Classy**: Convention-based Flask extensions

### Code Generators
- **Rails Generators**: Generate code following conventions
- **Spring Boot CLI**: Generate projects with conventions
- **Yeoman**: JavaScript project generator with conventions
- **Maven Archetypes**: Project templates with conventions

## Anti-Patterns

### Convention over Configuration Anti-Patterns
- **Configuration by Convention Only**: No way to override when conventions don't fit
- **Magic Without Documentation**: Conventions that are not discoverable
- **Inconsistent Conventions**: Different conventions for similar things
- **Breaking Conventions Silently**: Changing conventions without migration path

### When Not to Use CoC
- **Highly Specialized Systems**: Where conventions don't apply
- **Legacy Integration**: When existing systems don't follow conventions
- **Security-Critical Configuration**: Where explicit configuration is safer
- **Highly Dynamic Requirements**: Where conventions change frequently

## References

- [Convention over Configuration - Martin Fowler](https://martinfowler.com/bliki/ConventionOverConfiguration.html)
- [Rails Doctrine - DHH](https://rubyonrails.org/doctrine/)
- [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Twelve-Factor App - Configuration](https://12factor.net/config)
- [The Pragmatic Programmer - Convention vs Configuration](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/)