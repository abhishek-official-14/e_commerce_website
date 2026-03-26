# E-Commerce Backend (Node.js + Express + TypeScript)

Production-ready backend with JWT auth, MongoDB, role-based access, validation, and security middleware.

## Features

- TypeScript-first scalable structure
- Express + Mongoose setup
- User authentication with bcrypt password hashing
- JWT access token auth
- Role-based authorization (`user`, `admin`)
- Request validation with Zod
- Security middleware: Helmet, CORS, Rate Limiting
- Global error handling
- Product module with admin CRUD
- Search, filter, pagination on product listing
- Stock-aware purchase validation
- Cloudinary image upload integration

## Project Structure

```txt
src/
  app.ts
  server.ts
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  validators/
  types/
```

## Getting Started

1. Copy env file and set secrets:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run in development:

```bash
npm run dev
```

4. Build and start:

```bash
npm run build
npm start
```

## API Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me` (auth required)
- `GET /api/v1/users` (admin only)
- `GET /health`
- `POST /api/v1/products` (admin only, multipart/form-data)
- `PATCH /api/v1/products/:id` (admin only, multipart/form-data)
- `DELETE /api/v1/products/:id` (admin only)
- `GET /api/v1/products` (public, only active products)
- `GET /api/v1/products/:id` (public, only active products)
- `POST /api/v1/products/:id/purchase` (auth required, prevents out-of-stock purchases)

## Example Register Payload

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPass123"
}
```

## Security Notes

- Do not commit `.env`.
- Use long random `JWT_ACCESS_SECRET` in production.
- Run behind HTTPS and trusted reverse proxy in production.
