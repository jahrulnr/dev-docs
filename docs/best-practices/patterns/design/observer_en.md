# Observer Pattern

## Overview

The Observer Pattern is a behavioral design pattern that defines a one-to-many dependency between objects so that when one object (the subject) changes state, all its dependents (observers) are notified and updated automatically. This pattern promotes loose coupling between the subject and its observers, allowing for dynamic addition and removal of observers at runtime.

Benefits include decoupling of subject and observers, support for broadcast communication, and adherence to the open-closed principle by allowing new observers without modifying the subject.

## Key Components

- **Subject (Observable)**: The interface or abstract class defining methods for attaching, detaching, and notifying observers.
- **Observer**: The interface defining the update method that subjects call when their state changes.
- **Concrete Subject**: Implements the Subject interface and maintains the state of interest to observers.
- **Concrete Observer**: Implements the Observer interface and maintains a reference to the Concrete Subject.

```text
         Subject
        /      \
       /        \
Observer1    Observer2
      \        /
       \      /
     Concrete Subject
```

## When to Use

Use when changes to one object require changing others, and you don't know how many objects need to be changed. When you need to broadcast information to multiple receivers. In event-driven systems, MVC architectures, or publish-subscribe models. Avoid when observers are tightly coupled or when the subject has many observers causing performance issues.

## Implementation Guide

1. Define an Observer interface with an update method.
2. Define a Subject interface with methods to attach, detach, and notify observers.
3. Create Concrete Subject classes that implement Subject and maintain state.
4. Implement Concrete Observer classes that implement Observer and react to updates.
5. In the Concrete Subject, notify all attached observers when state changes.
6. Allow clients to dynamically attach/detach observers as needed.

## Examples

In a weather monitoring system, a WeatherStation (subject) notifies multiple displays (observers) when weather data changes.

```go
// Observer interface
type Observer interface {
    Update(temperature, humidity, pressure float64)
}

// Subject interface
type Subject interface {
    Attach(observer Observer)
    Detach(observer Observer)
    Notify()
}

// Concrete Subject
type WeatherStation struct {
    observers   []Observer
    temperature float64
    humidity    float64
    pressure    float64
}

func (w *WeatherStation) Attach(observer Observer) {
    w.observers = append(w.observers, observer)
}

func (w *WeatherStation) Detach(observer Observer) {
    // Implementation to remove observer
}

func (w *WeatherStation) Notify() {
    for _, observer := range w.observers {
        observer.Update(w.temperature, w.humidity, w.pressure)
    }
}

func (w *WeatherStation) SetMeasurements(temp, hum, pres float64) {
    w.temperature = temp
    w.humidity = hum
    w.pressure = pres
    w.Notify()
}

// Concrete Observer
type CurrentConditionsDisplay struct {
    subject *WeatherStation
}

func (c *CurrentConditionsDisplay) Update(temp, hum, pres float64) {
    fmt.Printf("Current conditions: %.1f°C, %.1f%% humidity, %.1f hPa\n", temp, hum, pres)
}
```

## Links

For related architectural patterns, see [Clean Architecture](../../architecture/patterns/clean-architecture_en.md). For event-driven patterns, check [Event-Driven Architecture](../../ecosystem/aws/event-driven_en.md). For coding principles, see [SOLID Principles](../../principles/solid_en.md).