# 🤝 Contributing to HikeHub

Thank you for your interest in contributing to HikeHub! This guide will help you get started.

## 📋 Code of Conduct

- Be respectful and inclusive
- Write clean, maintainable code
- Follow the existing code style
- Test your changes before submitting

## 🛠️ Development Setup

1. **Fork and clone the repository**
```bash
git clone https://github.com/yourusername/hikehub.git
cd hikehub
```

2. **Set up backend**
```bash
# Start PostgreSQL (Docker Compose recommended)
docker-compose up -d postgres

cd backend
./gradlew build
./gradlew bootRun              # Start backend
```

3. **Set up frontend**
```bash
cd frontend
npm install
npm run dev
```

## 📝 Code Style

### Backend (Java/Spring Boot)
- Use meaningful variable and method names
- Follow Java naming conventions (camelCase for methods, PascalCase for classes)
- Add JavaDoc comments for public methods
- Keep methods small and focused
- Use Lombok annotations to reduce boilerplate

### Frontend (React)
- Use functional components with hooks
- Keep components small (< 200 lines)
- Use Tailwind CSS utility classes
- Follow the existing file structure
- Use meaningful component names

## 🏗️ Project Structure

```
backend/
  src/main/java/.../
    controller/   # REST API endpoints
    service/      # Business logic
    repository/   # Database access
    model/        # JPA entities
    dto/          # Data transfer objects
    config/       # Configuration classes

frontend/
  src/
    pages/        # Page components
    components/   # Reusable components
    lib/          # Utilities (API client)
```

## 🔄 Making Changes

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Write clean, readable code
- Add comments where necessary
- Follow existing patterns

3. **Test your changes**
```bash
# Backend
cd backend
./gradlew test

# Frontend
cd frontend
npm test
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: add your feature description"
```

Use conventional commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

5. **Push and create a Pull Request**
```bash
git push origin feature/your-feature-name
```

## 🐛 Reporting Bugs

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser/environment information

## 💡 Suggesting Features

We love new ideas! When suggesting features:
- Explain the use case
- Describe the expected behavior
- Consider how it fits with existing features
- Be open to discussion

## 📚 Database Migrations

When adding database changes:

1. Create a new migration file in `backend/src/main/resources/db/migration/`
2. Name it: `V{version}__Description.sql` (e.g., `V5__Add_comments_table.sql`)
3. Use PostgreSQL-compatible SQL
4. Test locally before committing

## 🎨 UI/UX Guidelines

- Follow the existing color palette (purple-pink-orange gradient)
- Maintain responsive design (mobile-first)
- Use consistent spacing (Tailwind's spacing scale)
- Add smooth transitions and hover effects
- Test on different screen sizes

## ✅ Pull Request Checklist

Before submitting a PR:
- [ ] Code follows the project's code style
- [ ] Tests pass (`./gradlew test` and `npm test`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains what and why
- [ ] No console errors or warnings

## 🚀 Release Process

Maintainers will:
1. Review PR for code quality and functionality
2. Test changes in staging environment
3. Merge to main branch
4. Deploy to production (Render + Netlify auto-deploy)

## 📞 Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be patient and respectful

## 🙏 Thank You!

Every contribution, no matter how small, makes HikeHub better for everyone. We appreciate your time and effort!

---

**Happy coding! 🏔️**
