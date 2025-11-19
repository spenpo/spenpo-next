# Project Overview

This is a [Next.js](https://nextjs.org/) project that serves as a personal website and portfolio for a developer and entrepreneur. The project is built with a modern tech stack and integrates with various services.

## Technologies Used

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Framework:** [React](https://reactjs.org/)
- **Component Library:** [Material-UI (MUI)](https://mui.com/)
- **Styling:** [Emotion](https://emotion.sh/docs/introduction), [CSS Modules](https://github.com/css-modules/css-modules)
- **State Management:** [React Context](https://reactjs.org/docs/context.html)
- **Database:** [MySQL](https://www.mysql.com/) (likely via [PlanetScale](https://planetscale.com/) based on the connection string)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) with GitHub and Google providers.
- **Payments:** [Stripe](https://stripe.com/) for handling payments.
- **Deployment:** [Vercel](https://vercel.com/)
- **Other:**
  - [WordPress](https://wordpress.org/): Content is fetched from a WordPress backend.
  - [GitHub API](https://docs.github.com/en/rest): Used for automating the creation of landing pages.
  - [Redis](https://redis.io/): Used for caching.

## Architecture

The project follows the standard Next.js `app` directory structure.

- **`app/`**: Contains the main application code, including pages, components, and API routes.
- **`app/api/`**: Contains API routes for various functionalities, such as creating payment intents, handling Stripe webhooks, and more.
- **`app/components/`**: Contains reusable React components used throughout the application.
- **`app/context/`**: Contains React context providers for managing global state, such as authentication, theme, and snackbar notifications.
- **`app/services/`**: Contains services for interacting with external APIs, such as GitHub.
- **`prisma/`**: Contains the Prisma schema file (`schema.prisma`) that defines the database schema.
- **`public/`**: Contains static assets, such as images and fonts.

# Building and Running

## Prerequisites

- [Node.js](https://nodejs.org/en/)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Local Development

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Start the development server and local database:**

    ```bash
    pnpm dev
    ```

3.  **Start the local database and cache (if not using the dev command):**

    ```bash
    pnpm start:server
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Other useful commands

- **`pnpm build`**: Creates a production build of the application.
- **`pnpm start`**: Starts the production server.
- **`pnpm lint`**: Lints the code using ESLint.
- **`pnpm stripe`**: Starts a local Stripe webhook listener.

# Development Conventions

- **Code Style:** The project uses [Prettier](https://prettier.io/) for code formatting and [ESLint](https://eslint.org/) for linting.
- **Commits:** The project uses [Husky](https://typicode.github.io/husky/#/) and [lint-staged](https://github.com/okonet/lint-staged) to run linters on pre-commit.
- **Changelog:** The project uses [changie](https://changie.dev/) to manage the changelog.
- **Testing:** There are no explicit test files in the project. However, the project uses a database, so it is likely that there are integration tests that are not checked into the repository.
