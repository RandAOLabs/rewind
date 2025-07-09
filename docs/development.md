# Developer Setup Guide

This guide will help you set up your development environment for this project.

## Prerequisites

### 1. Install Node.js

#### macOS and Linux
We recommend using NVM (Node Version Manager):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Then install and use Node.js 22:
```bash
nvm install 22
nvm use 22
```

#### Windows
Download and install Node.js 22 directly from the [official Node.js website](https://nodejs.org/)

### 2. Verify Installation
```bash
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x
```

## Project Setup

### 1. Clone the Repository
```bash
git clone [repository-url]
cd arcao-front-end-template
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Project Locally
```bash
npm run dev
```
The development server will start and the application will be available at `http://localhost:5173`

## Additional Commands

```bash
npm run build    # Build the project for production
npm run preview  # Preview the production build locally
```

## Troubleshooting

If you encounter any issues:

1. Make sure you're using Node.js 22:
   ```bash
   node --version
   ```

2. Try removing and reinstalling dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Clear npm cache if needed:
   ```bash
   npm cache clean --force
   ```
