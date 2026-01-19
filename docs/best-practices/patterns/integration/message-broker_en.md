# Message Broker
## Overview

A Message Broker routes, buffers, and delivers messages between producers and consumers, often providing persistence, routing, and delivery guarantees. This enables reliable asynchronous communication in distributed systems.

## When to use
Use when building asynchronous, decoupled systems or integrating heterogeneous systems.

## Example
RabbitMQ or Kafka as brokers handling event streams and routing messages to consumers.

## Pros / Cons
- Pros: Reliability, buffering, flexible routing, persistence options.
- Cons: Operational overhead, schema evolution and consumer coordination challenges.

## References
- RabbitMQ/Kafka documentation.