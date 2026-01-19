# Mutual TLS (mTLS)

## Overview

mTLS authenticates both client and server using TLS certificates, providing strong mutual authentication and encrypted channels. This provides high security for service-to-service communication.

## When to use
Use for service-to-service authentication in internal networks, especially for high-security environments.

## Example
Services present client certificates to each other during TLS handshake and verify trust chains.

## Pros / Cons
- Pros: Strong identity assurance, encrypted transport.
- Cons: Certificate management complexity and operational overhead.

## References
- TLS and mTLS deployment guides.