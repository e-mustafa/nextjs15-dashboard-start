# 📊 E-commerce Dashboard – Next.js 15 (Enterprise Starter)

A scalable, production-ready **admin dashboard system** built with Next.js App Router, designed to handle real-world application requirements such as authentication, role-based access, internationalization, and complex data management.

This project demonstrates how to structure and build **enterprise-level frontend systems** with modern tools and clean architecture.

---

## 🚀 Live Demo

Under devlopment

---

## 🧩 Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** NextAuth (JWT + session handling)
- **Database:** Prisma ORM
- **State Management:** Zustand + React Context
- **Forms & Validation:** React Hook Form + Zod
- **Tables:** TanStack Table
- **Drag & Drop:** @dnd-kit
- **Image Handling:** ImageKit
- **i18n:** react-i18next + next-i18n-router
- **Logging:** Winston + Sentry

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure authentication using **NextAuth**
- Role-based access control (Admin / User)
- Protected routes via middleware
- Automatic redirect flows based on user state

---

### 🌍 Internationalization (i18n)
- Multi-language support (e.g., English / Arabic)
- Locale-based routing (`/en`, `/ar`)
- Automatic language detection
- RTL / LTR support

---

### 📊 Dashboard System
- Admin panel for managing application data
- Structured modules for scalability
- Reusable UI components across the system

---

### 📋 Data Tables
- Fully customizable tables using **TanStack Table**
- Sorting, filtering, and pagination support
- Typed column definitions with TypeScript

---

### 🧠 Forms & Validation
- Dynamic and reusable form system
- Schema-based validation using **Zod**
- Integrated with React Hook Form for performance

---

### 🧩 Drag & Drop
- Interactive drag-and-drop interfaces using **@dnd-kit**
- Reorderable lists and flexible UI layouts

---

### 🖼️ Image Management
- Upload and manage images via **ImageKit**
- Drag-and-drop upload support
- Optimized image delivery

---

### 📝 Rich Text Editing
- Advanced editor powered by **Lexical**
- Supports formatting, lists, and custom plugins

---

### 🗂️ State Management
- Lightweight global state using **Zustand**
- Context API for UI-level state (theme, layout)

---

### 📋 Logging & Monitoring
- Structured logging using **Winston**
- Error tracking with **Sentry**
- Environment-based configuration

---

## 🧠 Architecture & Decisions

- **App Router** for modern routing and server/client separation
- **Server-first approach** using React Server Components
- **Modular architecture** for scalability and maintainability
- **Separation of concerns** between UI, logic, and data layers
- **Reusable components and hooks** across the application

---

## 📁 Project Structure
src/
├── app/ # Routes, layouts, and server components
├── components/ # Reusable UI components
├── configs/ # App configurations
├── contexts/ # React Context providers
├── hooks/ # Custom hooks
├── lib/ # Utilities and helpers
├── server/ # Server actions and services
├── stores/ # Zustand state management
├── validation/ # Zod schemas
├── prisma/ # Database schema and migrations
├── locales/ # Translation files
└── middleware.ts # Auth + i18n middleware


---

## ⚙️ Middleware Logic

The middleware handles:

- Locale routing (i18n)
- Authentication protection
- Role-based redirection



---

## 🧪 Code Quality & Best Practices

- Strong TypeScript usage across the project
- Clean and modular folder structure
- Reusable and scalable components
- Separation between UI, logic, and data layers
- Production-ready architecture

---

## 🎯 What This Project Demonstrates

- Building enterprise-level dashboard systems
- Implementing authentication and RBAC
- Structuring scalable Next.js applications
- Managing complex UI interactions and state
- Integrating multiple systems into a cohesive architecture

---

## 👨‍💻 Author

Mustafa Abutabl  
Frontend Engineer (React / Next.js)

GitHub: https://github.com/e-mustafa