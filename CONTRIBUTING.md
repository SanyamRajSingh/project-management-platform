# Contributing to Flowtide

Thank you for your interest in contributing to Flowtide! This guide will help you get started.

## Getting Started

1. **Fork the repository** and clone it locally:
   ```bash
   git clone https://github.com/SanyamRajSingh/project-management-platform.git
   cd project-management-platform
   ```
2. **Set up the development environment** following the [README](README.md#getting-started)
3. **Create a branch** for your changes: `git checkout -b feature/your-feature-name`

## Development Workflow

1. Make your changes in a feature branch
2. Write or update tests if applicable
3. Ensure the code builds without errors:
   ```bash
   cd frontend && npm run build
   cd ../backend && npm run build
   cd ../mobile && npx tsc --noEmit
   ```
4. Commit your changes with a clear, descriptive message
5. Push to your fork and open a pull request

## Pull Request Guidelines

- Keep PRs focused on a single change
- Provide a clear description of what changed and why
- Link any related issues (e.g., "Closes #12")
- Include screenshots for UI changes
- Make sure CI checks pass

## Code Style

- **Frontend**: TypeScript, Next.js App Router, React functional components, Tailwind CSS
- **Backend**: TypeScript, NestJS module structure, TypeORM for database
- **Mobile**: TypeScript, React Native, Expo SDK
- Use meaningful variable and function names
- Follow the existing patterns in the codebase

## Reporting Bugs

Use the bug report template and include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OS/device information

## Suggesting Features

Use the feature request template and describe:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
