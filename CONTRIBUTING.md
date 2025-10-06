# 🤝 Contributing to MindX Full-Stack Application

Thank you for your interest in contributing to the MindX Full-Stack Application! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment. We pledge to:
- Be respectful and considerate
- Welcome diverse perspectives
- Accept constructive criticism gracefully
- Focus on what is best for the community

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/mindx-test.git
cd mindx-test

# Add upstream remote
git remote add upstream https://github.com/mindx/mindx-test.git
```

### 2. Setup Development Environment

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

---

## 💻 Development Workflow

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-user-profile`)
- `fix/` - Bug fixes (e.g., `fix/login-redirect`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-service`)
- `docs/` - Documentation (e.g., `docs/update-readme`)
- `test/` - Adding tests (e.g., `test/auth-controller`)

### Local Development

**Backend:**
```bash
cd backend
npm run dev  # Starts on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm run dev  # Starts on http://localhost:5173
```

### Making Changes

1. Make your changes
2. Test locally
3. Lint your code
4. Commit with clear messages
5. Push to your fork
6. Create a Pull Request

---

## 📏 Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Enable **strict mode**
- Avoid `any` types - use proper typing
- Use **interfaces** for object shapes
- Use **enums** for constants

**Example:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // implementation
}

// ❌ Bad
function getUser(id: any): any {
  // implementation
}
```

### Code Style

- Use **2 spaces** for indentation
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and interfaces
- Use **UPPER_SNAKE_CASE** for constants
- Maximum line length: **100 characters**

### Backend Conventions

```typescript
// Use async/await (not callbacks)
async function fetchData() {
  const result = await apiCall();
  return result;
}

// Use proper error handling
try {
  const data = await riskyOperation();
  return { success: true, data };
} catch (error) {
  logger.error("Operation failed", { error });
  throw new Error("Failed to perform operation");
}

// Use structured logging
logger.info("User authenticated", {
  userId: user.id,
  timestamp: new Date().toISOString()
});
```

### Frontend Conventions

```typescript
// Use functional components with hooks
import { useState, useEffect } from 'react';

export const MyComponent: React.FC = () => {
  const [state, setState] = useState<string>('');
  
  useEffect(() => {
    // Effect logic
  }, []);
  
  return <div>{state}</div>;
};

// Use Redux Toolkit for state management
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    }
  }
});
```

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Examples

```bash
# Feature
feat(auth): add OAuth refresh token rotation

# Bug fix
fix(frontend): resolve login redirect loop

# Documentation
docs(readme): update deployment instructions

# Refactor
refactor(backend): simplify error handling middleware
```

### Commit Message Guidelines

- Use **present tense** ("add feature" not "added feature")
- Use **imperative mood** ("move cursor to..." not "moves cursor to...")
- First line should be **50 characters or less**
- Separate subject from body with a blank line
- Wrap body at **72 characters**
- Reference issues and PRs when applicable

**Example:**
```
feat(auth): implement OAuth 2.0 authorization code flow

- Add OIDC client configuration
- Implement token exchange
- Add refresh token rotation
- Update authentication middleware

Closes #123
```

---

## 🔄 Pull Request Process

### Before Submitting

1. ✅ Update your branch with latest main
2. ✅ Run linting and fix issues
3. ✅ Test your changes locally
4. ✅ Update documentation if needed
5. ✅ Add tests for new features

```bash
# Update your branch
git checkout main
git pull upstream main
git checkout your-branch
git rebase main

# Lint code
cd backend && npm run lint
cd frontend && npm run lint

# Run tests
npm test
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. Submit PR with clear description
2. Respond to reviewer feedback
3. Make requested changes
4. Request re-review
5. PR will be merged by maintainers

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Testing

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

**Backend Example:**
```typescript
import { describe, it, expect } from '@jest/globals';
import { authService } from './auth.service';

describe('AuthService', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const userId = 'test-user-id';
      const tokens = await authService.generateTokens(userId);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });
  });
});
```

**Frontend Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { LoginPage } from './login';

describe('LoginPage', () => {
  it('renders login button', () => {
    render(<LoginPage />);
    const button = screen.getByText(/sign in/i);
    expect(button).toBeInTheDocument();
  });
});
```

---

## 📚 Documentation

### Code Comments

```typescript
/**
 * Exchanges authorization code for access and refresh tokens
 * 
 * @param code - Authorization code from OIDC provider
 * @param redirectUri - Callback URL used in authorization request
 * @returns Token response with access_token and refresh_token
 * @throws Error if token exchange fails
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  // Implementation
}
```

### README Updates

If you change:
- API endpoints → Update API Documentation section
- Environment variables → Update Environment Variables section
- Deployment process → Update Deployment section
- Dependencies → Update Prerequisites and Tech Stack sections

---

## 🎯 Areas for Contribution

### High Priority

- [ ] Add comprehensive unit tests
- [ ] Improve error handling
- [ ] Add request validation
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)

### Features

- [ ] User profile management
- [ ] Email notifications
- [ ] Multi-factor authentication
- [ ] Activity logging
- [ ] Admin dashboard

### Infrastructure

- [ ] CI/CD pipeline
- [ ] Automated testing
- [ ] Performance monitoring
- [ ] Security scanning
- [ ] Database migrations

---

## ❓ Questions?

If you have questions:
- Check [README.md](README.md)
- Browse existing [Issues](https://github.com/mindx/mindx-test/issues)
- Create a new [Discussion](https://github.com/mindx/mindx-test/discussions)

---

## 🙏 Thank You!

Thank you for contributing to the MindX Full-Stack Application! Your time and effort help make this project better for everyone.

---

**Happy Coding! 🚀**

