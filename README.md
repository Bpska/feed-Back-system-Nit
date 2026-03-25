# Feed Back System - Deployment Guide

This project is a full-stack application with a NestJS backend, a React/Vite frontend, and a PostgreSQL database. It is fully containerized using Docker.

## Prerequisites

Before starting, ensure your VPS has the following installed:
- **Git**
- **Docker**
- **Docker Compose**

## Deployment Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Bpska/feed-Back-system-Nit.git
   cd feed-Back-system-Nit
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory (or use the ones in `backend/` and `frontend/`).
   
   **Root / Backend (.env):**
   ```env
   DATABASE_HOST=db
   DATABASE_PORT=5423
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_secure_password
   DATABASE_NAME=propoly
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=24h
   ```

   **Frontend (.env):**
   ```env
   # IMPORTANT: Replace <your_vps_ip> with your actual VPS IP or domain
   VITE_API_URL=http://your_vps_ip:4000
   ```

   > [!IMPORTANT]
   > The `VITE_API_URL` must be the public address of your VPS because it is accessed by the browser, not the server.

3. **Build and Run with Docker Compose**
   ```bash
   docker compose up --build -d
   ```

   > [!NOTE]
   > Use `docker compose` (without the hyphen). If you get a `KeyError: 'ContainerConfig'`, it means you are using an outdated version of `docker-compose`. Using the modern `docker compose` command fixes this.

   This will:
   - Start a PostgreSQL database on internal port 5432 (mapped to **5423** on the host).
   - Start the NestJS backend on port **4000**.
   - Start the Nginx server serving the frontend on port **8282**.

4. **Verify Deployment**
   - Frontend: `http://your_vps_ip:8282`
   - API: `http://your_vps_ip:4000`
   - DB: Accessible on port `5423` from the host.

## Project Structure

- `backend/`: NestJS application logic.
- `frontend/`: React + Vite + Tailwind CSS.
- `docker-compose.yml`: Orchestration for all services.

## Common Commands

- **Stop all services:** `docker compose down`
- **View logs:** `docker compose logs -f`
- **Restart a specific service:** `docker compose restart api`
- **Update code and rebuild:**
  ```bash
  git pull
  docker compose up --build -d
  ```

## Troubleshooting: KeyError 'ContainerConfig'
If you see this error, it's due to an old `docker-compose` (v1) version. Run these commands to fix it:
```bash
# Remove old containers safely
docker compose down --remove-orphans

# Force a fresh build and start
docker compose up --build -d
```

## Port Configuration Summary
- **Frontend:** 8282
- **Backend API:** 4000
- **PostgreSQL:** 5423 (Host) / 5432 (Internal)