# Fail Fast
## Overview

Fail Fast means detecting errors early (input validation, startup checks) and surfacing them immediately to avoid compounding problems. This approach prevents silent failures and makes debugging easier by catching issues as soon as they occur.

## When to use
Use during validation, service startup, and critical path operations to surface issues quickly.

## Example
Validate configuration at startup and refuse to start if critical settings are missing.

## Pros / Cons
- Pros: Faster detection, easier debugging.
- Cons: Aggressive fail-fast may reduce availability if not combined with resilience strategies.

## References
- Defensive programming and reliability patterns.