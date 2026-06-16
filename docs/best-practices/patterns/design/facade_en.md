# Facade

## Overview

The **Facade** pattern provides a simplified, unified interface to a complex subsystem of classes, modules, or services. It does not hide the subsystem entirely—advanced callers can still reach underlying APIs—but most clients interact with one well-named entry point instead of orchestrating many dependencies.

Facades appear at module boundaries: a `PaymentService` that wraps gateway clients, idempotency stores, and ledger writers; a `MediaTranscodeFacade` over FFmpeg, storage, and queue publishers; or a library's public API over internal packages. The goal is **lower cognitive load** and **stable contracts** while the internals evolve.

Facade is often confused with Adapter (which translates incompatible interfaces) and Mediator (which coordinates peer objects). Facade's intent is **subsystem simplification**, not protocol conversion or object-to-object routing.

## How it works

1. Identify a cluster of collaborating types that clients currently wire together manually.
2. Define a **Facade** type that holds references to subsystem components (constructor injection or lazy init).
3. Expose high-level methods that map to common use cases (`PlaceOrder`, `UploadAndProcess`).
4. Delegate to subsystem classes; keep orchestration, defaults, and error mapping in the facade.

The facade may be a thin pass-through or include policy (retries, caching, feature flags). Avoid letting business rules grow unbounded inside the facade—that belongs in domain services.

## When to use

- Clients repeatedly perform the same multi-step interactions with a subsystem.
- You want to decouple application code from internal package layout or third-party SDK verbosity.
- You are defining the public surface of a library or bounded context.

## When not to use

- The subsystem already exposes one clear, minimal API.
- Every caller needs different low-level control— a facade that tries to serve all cases becomes a god object.
- You only need interface translation between two existing APIs—use **Adapter** instead.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Simpler client code and onboarding | Facade can become a dumping ground for logic |
| Insulates clients from subsystem churn | Extra indirection for power users |
| Documents intended usage paths | Wrong abstraction level blocks legitimate low-level access |

## Example

Without a facade, a handler imports `auth`, `billing`, `email`, and `audit` packages. With `OnboardingFacade.CompleteSignup(user)`, one call validates credentials, creates a subscription, sends welcome mail, and writes an audit event—order and error handling live in one place.

```go
type OnboardingFacade struct {
    auth    AuthService
    billing BillingService
    mail    Mailer
}

func (f OnboardingFacade) CompleteSignup(u User) error {
    if err := f.auth.Register(u); err != nil {
        return err
    }
    if err := f.billing.CreateTrial(u.ID); err != nil {
        return err
    }
    return f.mail.SendWelcome(u.Email)
}
```

## Related

- [Adapter](../design/adapter_en.md) — makes one interface match another; different intent
- [Mediator](../design/mediator_en.md) — coordinates peers; Facade faces outward to clients
- [Law of Demeter](../../principles/law-of-demeter_en.md) — facades reduce reach-through chains

## References

- Gamma et al. — *Design Patterns*, Facade chapter
- Module boundaries in Clean Architecture and hexagonal ports
