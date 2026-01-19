# MVP (Model-View-Presenter)

## Overview

MVP (Model-View-Presenter) is a software architectural pattern that separates the concerns of an application into three main components: Model, View, and Presenter. It is derived from the MVC pattern but emphasizes a clearer separation by having the Presenter act as an intermediary that handles all UI logic and user interactions. The Model represents the data and business logic, the View is responsible for displaying the UI, and the Presenter manages the communication between them. This pattern improves testability and maintainability by decoupling the UI from the business logic.

## Key Components

- **Model**: Handles data and business logic. It is independent of the UI and provides methods to retrieve and update data.
- **View**: Represents the user interface. It displays data and captures user input, but does not contain business logic.
- **Presenter**: Acts as a bridge between Model and View. It responds to user actions from the View, updates the Model, and refreshes the View accordingly.

```text
+-------+     +-----------+     +-------+
| View  |<--->| Presenter |<--->| Model |
+-------+     +-----------+     +-------+
```

## When to Use

Use MVP when:

- Building UI-intensive applications where you need to separate presentation logic from business logic.
- You want to improve testability of UI components by mocking the View.
- Working with frameworks that support passive Views, such as Android or web applications.
- Avoid in simple applications where the added complexity is not justified.

## Implementation Guide

1. **Define Interfaces**: Create interfaces for View and Model to allow for easy testing and dependency injection.
2. **Implement the Presenter**: The Presenter should hold references to the View and Model interfaces. It handles events from the View and updates the Model.
3. **Keep View Passive**: The View should only display data and delegate user actions to the Presenter.
4. **Use Dependency Injection**: Inject the Presenter with the View and Model to maintain loose coupling.

## Examples

Here's a simple example in Go for a user login feature:

```go
// Model interface
type UserModel interface {
    ValidateCredentials(username, password string) bool
}

// View interface
type LoginView interface {
    ShowSuccess()
    ShowError(message string)
    GetUsername() string
    GetPassword() string
}

// Presenter
type LoginPresenter struct {
    model UserModel
    view  LoginView
}

func (p *LoginPresenter) OnLoginClicked() {
    username := p.view.GetUsername()
    password := p.view.GetPassword()
    if p.model.ValidateCredentials(username, password) {
        p.view.ShowSuccess()
    } else {
        p.view.ShowError("Invalid credentials")
    }
}
```

## Links

For more on separation of concerns, see Separation of Concerns. For related patterns, check Design Patterns.
