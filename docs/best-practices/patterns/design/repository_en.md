# Repository Pattern

## Overview

The Repository Pattern is a design pattern that abstracts data access logic, providing a collection-like interface for accessing domain objects. It decouples the business logic from data access technologies, making the code more testable and maintainable.

Benefits include separation of concerns (business logic vs. data access), easier unit testing (mock repositories), technology independence (switch databases without changing business code), and centralized data access logic.

## Key Components

- **Repository Interface**: Defines methods for CRUD operations (Create, Read, Update, Delete).
- **Concrete Repository**: Implements the interface using a specific data store (e.g., SQL, NoSQL).
- **Domain Entity**: The business object being stored/retrieved.
- **Unit of Work (Optional)**: Manages transactions across multiple repositories.

```text
Client (Business Logic)
          |
          v
+----------------+       Access       +----------------+
| Repository     |  --------------->  | Data Store     |
| Interface      |                     | (DB, API, etc.)|
+----------------+                     +----------------+
          ^
          |
     Concrete Repository
```

## When to Use

Use in domain-driven design to abstract data persistence. When you need to mock data access for testing. In applications with complex queries or multiple data sources. Avoid for simple CRUD without abstraction needs.

## Implementation Guide

1. Define a Repository interface with methods like Save, FindById, FindAll, Delete.
2. Implement Concrete Repository classes for each data store (e.g., SqlUserRepository).
3. Inject the repository into domain services or use cases.
4. Use dependency injection to switch implementations (e.g., for testing).
5. Optionally, implement Unit of Work for transaction management.

## Examples

In an ecommerce system, UserRepository abstracts user data access, allowing business logic to work with User entities without knowing the database details.

```go
// Repository Interface
type UserRepository interface {
    Save(user User) error
    FindById(id int) (User, error)
    FindAll() ([]User, error)
    Delete(id int) error
}

// Concrete Repository
type SqlUserRepository struct {
    db *sql.DB
}

func (r SqlUserRepository) Save(user User) error {
    // SQL implementation
}
```

## Links

For related architectural patterns, see [CQRS](../architectural/cqrs_en.md). For domain models, check [Coding Rules](../../coding-rules.md).
