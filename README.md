## PawMart Monorepo

This repo contains:
- `paw-mart-backend` (Express + Prisma + PostgreSQL)
- `paw-mart-frontend` (Next.js + Tailwind + Ant Design)

### Backend Setup
1) Copy env template and edit values:
   - Windows: copy `paw-mart-backend/ENV.example` to `paw-mart-backend/.env`
   - Update at least: `DATABASE_URL`, `JWT_SECRET`, `FROM_EMAIL`, `ADMIN_EMAIL`, `SMTP_*`
2) Install and set up DB
```bash
cd paw-mart-backend
npm install
npx prisma generate
npx prisma migrate dev
```
3) (Optional) Create initial admin
```bash
node create-admin.js
```
4) Run API server
```bash
npm run dev
```
Server runs at http://localhost:4000

### Frontend Setup
```bash
cd paw-mart-frontend
npm install
npm run dev
```
App runs at http://localhost:3000

### Notes
- Do not commit `.env` files. They are ignored by Git.
- If your frontend URL changes, update CORS origins in `paw-mart-backend/index.js`.
- For email delivery, configure SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
