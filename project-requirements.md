# Group Project - FinEdge – Personal Finance & Expense Tracker API

**Brief**

### **Project Requirements**

### **1. Fundamentals & Setup (10 Points)**

- Initialize project with npm init
- Setup folder structure using MVC architecture
- Create a /health route to verify server running

### **2. REST API Development (30 Points)**

**Core Entities:**

- **User** → manages authentication and preferences
- **Transaction** → type (income/expense), category, amount, date
- **Budget** → monthly goal and savings target

**Core Endpoints:**

**Method**

**Route**

**Description**

POST

/users

Register new user

POST

/transactions

Add income/expense

GET

/transactions

Fetch all transactions

GET

/transactions/:id

View single transaction

PATCH

/transactions/:id

Update transaction

DELETE

/transactions/:id

Delete transaction

GET

/summary

Fetch income-expense summary

### **3. Async Programming & Middleware (20 Points)**

- Use async/await for DB or file I/O operations
- Implement global error-handling middleware
- Add custom middleware for:
    - Logging request details
    - Validating transaction inputs

### **4. Advanced Node Concepts (20 Points)**

- Use modular routes and controllers
- Create reusable services for business logic
- Add environment variables for configuration management
- Implement custom error classes
- Use built-in fs/promises for file persistence
- Add test cases for core endpoints
- **Bonus:** Implement simple JWT-based user session (mock)

### **5. Bonus Features (20 Points)**

Choose any **two** of the following:

**A. Analytics & Reporting**

- Calculate total income, expenses, and balance
- Filter transactions by category/date
- Show monthly trends

**B. AI or Automation Feature**

- Suggest saving tips or budgets based on past spending
- Auto-categorize expenses using keyword matching
- Real-time updates on new transactions

**C. Data Persistence**

- Store and retrieve data using JSON files or MongoDB

**D. Advanced Middleware**

- Add rate limiter for requests
- Implement CORS and request logging
- Implement a simple in-memory cache service with TTL expiry. Use it in /summary to avoid recomputing data repeatedly.

**Submission guidelines**

- Write a clear and concise README file
- To submit your project, please provide a link to your GitHub repository.
- [Important] Make sure the repository is public.

## ATTACHED PDF DATA

<aside>
💡

FinEdge – Personal Finance & Expense Tracker API
Overview:
Build a RESTful API backend for a personal finance tracker using Node.js and Express,
demonstrating asynchronous programming, modular architecture, and clean REST design.
Users can create accounts, add income or expenses, view summaries, and generate
monthly insights.
Learning Objectives
Students will:
● Understand Node.js runtime and event loop
● Build APIs using Express.js
● Implement CRUD routes and modular architecture
● Use middleware, async/await, and error handling
● Apply REST best practices
● Work with JSON-based data persistence or MongoDB (optional)
● Follow clean code and separation of concerns
Expected Project Structure
src/
├── app.js
├── routes/
│ ├── userRoutes.js
│ └── transactionRoutes.js
├── controllers/
│ ├── userController.js
│ └── transactionController.js
├── services/
│ ├── userService.js
│ └── transactionService.js
├── models/
│ ├── userModel.js
│ └── transactionModel.js
├── middleware/
│ ├── errorHandler.js
│ ├── logger.js
│ └── validator.js
├── utils/
│ ├── analytics.js
│ └── aiHelper.js
└── data/
├── users.json
└── transactions.json
Member-Wise Module Allocation
Member Module Key Deliverables
1 User APIs User routes and controller
2 Transaction APIs Transaction module implementation
3 Middleware & Utils Error handling, validation, and logging
4 Analytics & Documentation Summary logic and Postman collection

</aside>