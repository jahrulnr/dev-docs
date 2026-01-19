# MVVM (Model-View-ViewModel)

## Overview

MVVM (Model-View-ViewModel) is an architectural pattern that separates the development of the graphical user interface from the business logic or back-end logic. It was introduced by Microsoft for WPF and Silverlight applications. The pattern divides the application into three layers: Model (data), View (UI), and ViewModel (presentation logic), promoting separation of concerns, testability, and maintainability. Data binding is a key feature, allowing automatic synchronization between the View and ViewModel.

## Key Components

MVVM consists of three main components:

- **Model**: Represents the data and business logic. It handles data access, validation, and manipulation, independent of the UI.
- **View**: The user interface that displays data and captures user input. It binds to the ViewModel and remains as simple as possible.
- **ViewModel**: Acts as an intermediary between the Model and View. It exposes data properties and commands for the View, handling presentation logic and user interactions.

```text
+--------+
|  View  |
| (UI)   |
+--------+
    |
+--------+
|ViewModel|
|(Logic) |
+--------+
    |
+--------+
| Model  |
| (Data) |
+--------+
```

## When to Use

Choose MVVM for:

- UI-intensive applications, especially those using data binding frameworks like WPF, Angular, Vue.js, or React with state management.
- Projects requiring separation of UI from business logic to improve testability and reusability.
- Cross-platform or multi-device apps where the same ViewModel can be reused with different Views.
- Avoid in simple applications without complex UI interactions, where the pattern adds unnecessary overhead.

## Implementation Guide

1. **Define the Model**: Create classes or structs for data entities and business rules, ensuring they are independent of UI concerns.
2. **Create the ViewModel**: Implement ViewModels that expose Model data as properties and handle commands or events for user actions. Use data binding to connect to the View.
3. **Design the View**: Build the UI to bind to ViewModel properties. Keep logic minimal; use declarative bindings.
4. **Implement Data Binding**: Use framework features (e.g., WPF's INotifyPropertyChanged) to notify the View of changes.
5. **Test the ViewModel**: Focus unit tests on ViewModels, mocking the Model if needed.

## Examples

In a simple user profile app, the Model manages user data, the ViewModel formats it for display, and the View shows it.

```go
// Model
type User struct {
    Name string
    Age  int
}

func (u *User) Validate() error {
    if u.Age < 0 {
        return errors.New("age cannot be negative")
    }
    return nil
}

// ViewModel (conceptual, using channels for binding simulation)
type UserViewModel struct {
    user       *User
    nameChange chan string
}

func NewUserViewModel(user *User) *UserViewModel {
    return &UserViewModel{
        user:       user,
        nameChange: make(chan string),
    }
}

func (vm *UserViewModel) GetName() string {
    return vm.user.Name
}

func (vm *UserViewModel) SetName(name string) {
    vm.user.Name = name
    vm.nameChange <- name // Simulate property change notification
}

func (vm *UserViewModel) GetDisplayText() string {
    return fmt.Sprintf("User: %s, Age: %d", vm.user.Name, vm.user.Age)
}

// View (conceptual console output)
func display(vm *UserViewModel) {
    go func() {
        for name := range vm.nameChange {
            fmt.Printf("Name updated to: %s\n", name)
        }
    }()
    fmt.Println(vm.GetDisplayText())
}
```

## Links

For more on SOLID principles, see SOLID Principles. For separation of concerns, check Separation of Concerns.
