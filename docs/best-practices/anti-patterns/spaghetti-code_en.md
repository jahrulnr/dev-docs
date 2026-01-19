# Spaghetti Code Anti-Pattern

## Overview

Spaghetti Code is an anti-pattern where code becomes tangled and unstructured, with poor separation of concerns and unclear flow. Like a plate of spaghetti, it's difficult to follow individual strands (logic paths) through the codebase.

## Root Cause

- **Lack of Planning**: Code written without proper design or architecture.
- **Time Pressure**: Developers taking shortcuts to meet deadlines.
- **Copy-Paste Programming**: Duplicating code instead of creating reusable functions.
- **No Code Reviews**: Absence of peer reviews allows poor practices to persist.

## Impact

- **Maintenance Nightmare**: Small changes can break unrelated functionality.
- **Bug Introduction**: Difficult to understand code leads to more bugs.
- **Low Testability**: Hard to write unit tests for intertwined logic.
- **Onboarding Difficulty**: New developers struggle to understand the codebase.

## Examples

### Bad Example (JavaScript)

```javascript
function processOrder(orderId) {
  // Get order data
  let order = database.query("SELECT * FROM orders WHERE id = " + orderId);

  // Check inventory
  let inventory = database.query("SELECT * FROM inventory WHERE product_id = " + order.product_id);
  if (inventory.quantity < order.quantity) {
    // Send email
    emailService.send("admin@company.com", "Out of stock: " + order.product_id);
    return false;
  }

  // Process payment
  let paymentResult = paymentGateway.charge(order.total);
  if (!paymentResult.success) {
    // Log error
    console.log("Payment failed for order " + orderId);
    return false;
  }

  // Update inventory
  database.query("UPDATE inventory SET quantity = quantity - " + order.quantity + " WHERE product_id = " + order.product_id);

  // Send confirmation
  emailService.send(order.customer_email, "Order confirmed: " + orderId);

  return true;
}
```

### Good Example (Refactored)

```javascript
class OrderProcessor {
  constructor(orderRepo, inventoryService, paymentService, notificationService) {
    this.orderRepo = orderRepo;
    this.inventoryService = inventoryService;
    this.paymentService = paymentService;
    this.notificationService = notificationService;
  }

  async processOrder(orderId) {
    const order = await this.orderRepo.getById(orderId);

    if (!await this.inventoryService.checkAvailability(order.productId, order.quantity)) {
      await this.notificationService.notifyAdminOutOfStock(order.productId);
      return false;
    }

    const paymentResult = await this.paymentService.charge(order.total);
    if (!paymentResult.success) {
      await this.notificationService.logPaymentFailure(orderId);
      return false;
    }

    await this.inventoryService.updateStock(order.productId, -order.quantity);
    await this.notificationService.sendOrderConfirmation(order.customerEmail, orderId);

    return true;
  }
}
```

## Mitigation Strategies

1. **Introduce Structure**: Break down large functions into smaller, focused functions.
2. **Apply Design Patterns**: Use appropriate patterns like Strategy, Factory, or Observer.
3. **Improve Separation of Concerns**: Group related functionality into classes/modules.
4. **Add Abstractions**: Create interfaces and abstract classes to define clear contracts.
5. **Refactor Incrementally**: Make small, safe changes over time.

## Best Practices

- **Single Responsibility**: Each function/method should do one thing.
- **DRY Principle**: Don't Repeat Yourself - eliminate code duplication.
- **Meaningful Names**: Use descriptive names for variables, functions, and classes.
- **Code Reviews**: Regular peer reviews to catch spaghetti code early.
- **Automated Testing**: Write tests to ensure refactoring doesn't break functionality.

## Tools

- **Static Analysis Tools**: ESLint, SonarQube for detecting code smells.
- **Code Metrics**: Tools to measure cyclomatic complexity and function length.
- **Refactoring Tools**: IDE features for extracting methods and classes.

## References

- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)
- [Code Complete by Steve McConnell](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670)