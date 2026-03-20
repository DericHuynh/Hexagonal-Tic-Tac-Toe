# Contributing to Hexagonal Tic-Tac-Toe

First off, thank you for considering contributing! This project uses a monorepo structure and relies on **Vite+** (The Unified Toolchain for the Web) to manage the runtime, package manager, and tasks.

## Prerequisites
- **Node.js**: >= 24
- **Cloudflare Account**: Required for D1 Database and Durable Objects
- **Vite-plus**: Installed globally or in $PATH$

---

## 1. Install Vite+ Globally

To work on this project, you need to install the Vite+ CLI (`vp`) globally. You can find the official instructions at [https://viteplus.dev/](https://viteplus.dev/). 

### Adding to `%PATH%`
The installation scripts above should automatically append the `vp` command to your system's PATH. However, if your terminal says `"vp: command not found"`, you need to add it manually:

- **Windows**: Add `%USERPROFILE%\.viteplus\bin` (or the installation path specified in the script's output) to your System's `Path` Environment Variable. Restart your terminal.
- **macOS / Linux**: Add `export PATH="$HOME/.viteplus/bin:$PATH"` to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) and run `source ~/.zshrc`.

*(Alternatively, you can install it via npm using `npm install -g vite-plus`, which will automatically place it in your npm global bin folder)*

---

## 2. Project Setup

Once `vp` is installed, clone the repository and run our standard setup script. Vite+ will automatically detect `pnpm` and install all workspace dependencies:

```bash
vp run setup
```

---

## 3. Configure Cloudflare D1 Database

This project uses Cloudflare D1 for relational data storage. Because `database_id`s are unique to each Cloudflare account, you cannot use the one hardcoded in the repository. You must create your own database to run the app or run migrations locally.

1. **Login to Cloudflare** (if you haven't already):
   ```bash
   vpx wrangler login
   ```

2. **Create a new D1 database**:
   ```bash
   vpx wrangler d1 create hex-tic-tac-toe-db
   ```

3. **Update `wrangler.json`**:
   The output of the previous command will give you a table containing a `database_id`. Copy that ID, open `apps/web/wrangler.json` (or the `wrangler.json` at your project root), and replace the existing `database_id` in the `d1_databases` array:
   ```json
   "d1_databases":[
     {
       "binding": "DB",
       "database_name": "hex-tic-tac-toe-db",
       "database_id": "YOUR_NEW_DATABASE_ID_HERE", 
       "migrations_dir": "./drizzle/migrations"
     }
   ]
   ```

4. **Run Local Migrations**:
   Now that your database is configured, apply the initial schema so your local environment is ready:
   ```bash
   vp run db:migrate
   ```

---

## 4. Useful Commands

We have set up several scripts in `package.json` to make contributing, testing, and verifying your code easy:

- **`vp run setup`**: Installs all dependencies across the monorepo.
- **`vp run dev`**: Starts the local development server for the web app.
- **`vp run test`**: Runs all unit, integration, and end-to-end tests across all packages.
- **`vp run verify`**: Formats, lints, type-checks, and runs all tests. **Run this before opening a Pull Request!**
- **`vp check`**: Formats, lints, and type-checks the codebase in one blazing fast pass.
