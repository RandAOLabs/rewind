# Contributing to ARNS Rewind

We welcome contributions to ARNS Rewind! This guide will help you get started with contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/rewind.git
   cd rewind
   ```
3. **Set up the development environment** following our [Development Guide](development.md)

## Development Workflow

1. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards:
   - Use TypeScript for type safety
   - Follow the existing code style and patterns
   - Write clear, descriptive variable and function names
   - Keep functions focused and reusable
   - Maintain responsive design principles

3. **Test your changes**:
   ```bash
   npm run dev    # Test locally
   npm run build  # Ensure it builds successfully
   ```

4. **Commit your changes** with a clear message:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Code Standards

- **Low Coupling**: Keep components and modules loosely coupled
- **Reusable Logic**: Create reusable functions and components
- **File Organization**: Split files when they exceed 200 lines
- **Documentation**: Document non-intuitive code sections
- **Responsive Design**: Ensure compatibility across desktop, tablet, and mobile

## Dependencies

- Use `ao-js-sdk` for AO interactions
- Use `lucide-react` for icons
- Follow the existing dependency patterns

## Pull Request Guidelines

- Fill out the PR template completely
- Ensure your code builds successfully
- Include screenshots for UI changes
- Reference any related issues
- Keep PRs focused on a single feature or fix

## Questions?

If you have questions about contributing, feel free to:
- Open an issue for discussion
- Check existing issues and discussions
- Review the codebase for examples

Thank you for contributing to ARNS Rewind!
