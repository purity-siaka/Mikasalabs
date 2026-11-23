# Mikasa Labs

Mikasa Labs is a Next.js platform with a public website, client portal, admin
dashboard, CRM, project and invoice management, and M-Pesa payment integration.

## Requirements

- Node.js 20 or later
- PostgreSQL (Neon or another PostgreSQL provider)

## Local setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`,
   `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Use an `AUTH_SECRET` with at least 32
   characters and an admin password with at least 10 characters.

3. Sync the database schema and generate Prisma Client:

   ```powershell
   npm run db:push
   npm run db:generate
   ```

4. Create the initial admin account:

   ```powershell
   npm run seed
   ```

   To change an existing admin password, set `ADMIN_PASSWORD` in `.env` and run
   `npm run admin:reset-password`.

5. Start the development server:

   ```powershell
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). The client sign-in page is
at `/login`; the admin dashboard is at `/admin`.

## M-Pesa and email

M-Pesa payments require Daraja sandbox or production credentials in `.env`.
The callback URL must be publicly reachable by Safaricom; use an HTTPS
`APP_URL` when testing callbacks outside local development.

SMTP settings are optional. Without SMTP configuration, outgoing email content
is written to the server log.

## Safety

Never commit `.env` or share its contents. It is excluded by `.gitignore`.
