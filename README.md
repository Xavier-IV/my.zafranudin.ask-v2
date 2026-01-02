# 🗣️ Ask Me Anything

An anonymous Q&A and feedback platform built with **Next.js 16**, **PocketBase**, and **Cloudflare Turnstile**. Users can send anonymous messages or share feedback without creating an account.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PocketBase](https://img.shields.io/badge/PocketBase-0.26-blue?style=flat-square)](https://pocketbase.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## ✨ Features

- **Anonymous Messaging** - Send questions without revealing your identity
- **Feedback System** - Share feedback with optional name/alias
- **Dark/Light Mode** - Theme toggle with smooth transitions
- **PocketBase Backend** - Lightweight, self-hosted database

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [PocketBase](https://pocketbase.io/) | Backend & database |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | UI components |
| [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) | Bot protection |
| [Zod](https://zod.dev/) | Schema validation |

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- [PocketBase](https://pocketbase.io/) binary

### 1. Clone the Repository

```bash
git clone https://github.com/Xavier-IV/my.zafranudin.ask-v2.git
cd my.zafranudin.ask-v2
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up PocketBase

1. Download the PocketBase binary from [PocketBase Releases](https://github.com/pocketbase/pocketbase/releases/latest)
2. Extract and place the `pocketbase` binary in the `pocketbase/` directory
3. Make it executable:
   ```bash
   chmod +x pocketbase/pocketbase
   ```

### 4. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_SECRET_KEY=your_secret_key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

> 💡 Get Turnstile keys from [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)

### 5. Start Development Servers

Run both PocketBase and Next.js simultaneously:

```bash
bun run dev:all
```

Or run them separately:

```bash
# Terminal 1: Start PocketBase
bun run pocketbase:serve

# Terminal 2: Start Next.js
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

> 📝 Access the PocketBase admin UI at [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/) to create your first admin account.

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run pocketbase:serve` | Start PocketBase server |
| `bun run dev:all` | Start both PocketBase and Next.js |

## 📁 Project Structure

```
.
├── pocketbase/          # PocketBase binary & data
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── feedbacks/   # Feedbacks page
│   │   ├── actions.ts   # Server actions
│   │   ├── home-client.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/      # React components
│   │   └── ui/          # shadcn/ui components
│   └── lib/             # Utility functions
├── .env.example         # Environment variables template
├── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute

- 🐛 **Bug Reports** - Found a bug? [Open an issue](https://github.com/Xavier-IV/my.zafranudin.ask-v2/issues/new)
- 💡 **Feature Requests** - Have an idea? Share it in the issues
- 📝 **Documentation** - Help improve the docs
- 🧑‍💻 **Code Contributions** - Submit a pull request

### Development Workflow

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/my.zafranudin.ask-v2.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write meaningful commit messages
   - Test your changes locally

4. **Run linting**
   ```bash
   bun run lint
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   # or
   git commit -m "fix: describe the bug fix"
   ```

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a PR on GitHub.

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

### Code Style

- Use TypeScript for all new code
- Follow the existing project structure
- Use meaningful variable and function names
- Add comments for complex logic

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Site**: [ask.zafranudin.my](https://ask.zafranudin.my)
- **Author**: [@zafranudin_z](https://www.threads.com/@zafranudin_z)
- **GitHub**: [Xavier-IV/my.zafranudin.ask-v2](https://github.com/Xavier-IV/my.zafranudin.ask-v2)

---

<p align="center">
  Made with ❤️ by <a href="https://zafranudin.my">Zafranudin Zafrin</a>
</p>
