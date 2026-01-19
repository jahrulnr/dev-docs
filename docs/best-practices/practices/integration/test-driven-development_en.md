# Test-Driven Development (TDD)

## Overview

Test-Driven Development (TDD) is a software development methodology where tests are written before implementation code. The TDD cycle consists of Red-Green-Refactor: write a failing test (Red), create minimal code to pass (Green), then refactor to improve design without changing behavior. This approach ensures code is always tested, reduces bugs, and promotes modular design.

TDD differs from traditional testing done after development; here, tests drive the implementation.

## Core Principles

- **Red-Green-Refactor Cycle**: Iterative cycle for development.
- **Test-First**: Tests written before code.
- **Incremental Development**: Code built step-by-step based on tests.
- **Safe Refactoring**: Tests as a safety net for changes.
- **High Coverage**: Target 100% domain logic coverage.

## Red-Green-Refactor Cycle

1. **Red**: Write a test for new feature; test will fail as code doesn't exist.
2. **Green**: Implement minimal code to make test pass.
3. **Refactor**: Improve code (e.g., remove duplication) without changing behavior; tests remain passing.

Simple cycle example with Jest (JavaScript):

```javascript
// Red: Write test
test('add should return sum of two numbers', () => {
  expect(add(2, 3)).toBe(5);
});

// Green: Minimal implementation
function add(a, b) {
  return a + b;
}

// Refactor: If needed, improve without changing behavior
```

## Suitability with Development Methodologies

TDD is highly suitable for:

- **Agile/Scrum**: Supports iterative development with fast feedback.
- **Clean Code Practices**: Encourages SOLID principles and decoupling.
- **Legacy Refactoring**: Safe for changing existing code.
- **Team Collaboration**: Tests as clear specifications.

Less suitable for:
- Quick prototyping without structure.
- Systems with complex dependencies hard to mock.
- Teams without testing experience.

## Implementation Examples

### Example in Golang with Testing Framework
```go
// Red: Test for calculation function
func TestCalculateTotal(t *testing.T) {
    result := CalculateTotal(100, 0.1) // 100 + 10% tax
    if result != 110 {
        t.Errorf("Expected 110, got %f", result)
    }
}

// Green: Implementation
func CalculateTotal(price float64, taxRate float64) float64 {
    return price + (price * taxRate)
}

// Refactor: Add error handling
func CalculateTotal(price float64, taxRate float64) (float64, error) {
    if price < 0 {
        return 0, errors.New("price cannot be negative")
    }
    return price + (price * taxRate), nil
}
```

Update test to handle error.

### Example with Mocking
Use libraries like gomock for dependencies.

## Pros and Cons

### Pros
- **Bug Reduction**: Early testing prevents regressions.
- **Better Design**: Encourages decoupling and single responsibility.
- **Confidence in Refactor**: Tests as safety net.
- **Documentation**: Tests as living specifications.
- **Faster Debugging**: Isolate issues through tests.

### Cons
- **Learning Curve**: Requires mindset shift.
- **Slower Initial Development**: Time spent writing tests.
- **Maintenance Overhead**: Tests need updates during refactor.
- **Not for UI/Integration**: Better for unit tests.
- **Over-Testing**: Risk of brittle tests.

## Best Practices

- **Start Small**: Begin with simple tests.
- **One Test at a Time**: Focus on one requirement.
- **Mock Dependencies**: Use stubs/mocks for isolation.
- **Run Tests Often**: Automate with CI/CD.
- **Refactor Regularly**: Keep code clean without breaking tests.

## Common Pitfalls

- **Testing Implementation**: Test behavior, not internal details.
- **Skipping Refactor**: Accumulate technical debt.
- **Incomplete Coverage**: Focus on main domain logic.
- **Slow Tests**: Avoid integration tests in TDD.
- **Resistance**: Teams need training to adopt.

## References
- Book "Test-Driven Development: By Example" by Kent Beck.
- Martin Fowler's articles on TDD.
- Documentation for testing frameworks (Jest, JUnit, pytest).
- Tools: JUnit, pytest, Mockito for mocking.