# MVC (Model-View-Controller)

## Overview

MVC (Model-View-Controller) is a software architectural pattern that separates an application into three interconnected components: Model, View, and Controller. This separation helps manage complexity by dividing responsibilities, making the code more modular, testable, and maintainable. The Model represents the data and business logic, the View handles the presentation layer, and the Controller manages user input and updates the Model and View accordingly. Originating from Smalltalk in the 1970s, MVC is widely used in web development frameworks like Ruby on Rails, ASP.NET, and Express.js, promoting a clear separation of concerns.

## Key Components

MVC consists of three main components:

- **Model**: Manages the data, business logic, and state of the application. It is independent of the user interface and handles data retrieval, validation, and manipulation.
- **View**: Responsible for rendering the user interface and displaying data from the Model. It receives updates from the Controller and presents information to the user.
- **Controller**: Acts as an intermediary between the Model and View. It processes user input, updates the Model, and selects the appropriate View to display.

```text
+-----------+     +-----------+     +-----------+
|   View    | <-- | Controller| --> |   Model   |
| (UI)      |     | (Logic)   |     | (Data)    |
+-----------+     +-----------+     +-----------+
       |                 |
       +-----------------+
          User Interaction
```

## When to Use

Choose MVC for:

- Web applications where you need to separate business logic from presentation.
- Projects requiring reusable components and easy maintenance.
- Frameworks that support rapid development, like in full-stack web apps.
- Avoid in simple scripts or when tight coupling between UI and logic is acceptable.

## Implementation Guide

1. **Define the Model**: Create structs or classes for data entities and methods for business logic. Ensure Models are independent of Views and Controllers.
2. **Create the View**: Implement templates or components for rendering UI. Views should only display data and not contain logic.
3. **Build the Controller**: Write handlers for user requests. Controllers update the Model and select Views based on application state.
4. **Wire Components**: Use routing to connect Controllers to endpoints, and ensure Controllers inject data into Views from Models.
5. **Test Separately**: Unit test Models for logic, Controllers for behavior, and Views for rendering.

## Examples

Here's a simple Go example using the Gin framework for a web app:

```go
// Model
type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

// View (simplified as JSON response)
func renderUser(w http.ResponseWriter, user User) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

// Controller
func getUser(c *gin.Context) {
    id := c.Param("id")
    // Simulate fetching from Model
    user := User{ID: 1, Name: "John Doe"}
    renderUser(c.Writer, user)
}

func main() {
    r := gin.Default()
    r.GET("/user/:id", getUser)
    r.Run()
}
```

## Links

For more on separation of concerns, see Separation of Concerns. For web deployment, check AWS Deployment.
