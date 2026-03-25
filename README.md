# Feed Back System - Deployment Guide

This project is a full-stack application with a NestJS backend, a React/Vite frontend, and a PostgreSQL database. It is fully containerized using Docker and utilizes an Nginx reverse proxy.

## Prerequisites

Before starting, ensure your VPS has the following installed:
- **Git**
- **Docker**
- **Docker Compose**

## Deployment Steps

### 1. Clone the Repository
```bash
git clone https://github.com/Bpska/feed-Back-system-Nit.git
cd feed-Back-system-Nit
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or use the one in `backend/`).

**Root / Backend (.env):**
```env
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=propoly
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
```

> [!NOTE]
> The frontend no longer requires a `.env` file in production. All API requests are automatically routed to the backend container via the Nginx reverse proxy.

### 3. Build and Run with Docker Compose
```bash
docker compose up --build -d
```

This will:
- Start a PostgreSQL database on **5423** on the host.
- Start the NestJS backend API container.
- Start the Nginx server serving the frontend on port **8282**.

### 4. Admin Account Seeding
To log into the admin panel for the first time, you must create the default admin account.

Run the seeding command inside the running API container:
```bash
docker exec -it propoly_api npm run seed:admin
```

**Default Admin Credentials:**
- **Email:** `bpskar2@gmail.com`
- **Password:** `123456789`
- **Admin Code:** `2025`

### 5. Domain Configuration (thenalandaexam.in)
Follow these steps to safely connect your top-level domain (`thenalandaexam.in`) to the containerized application.

#### A. DNS Configuration
Log into your domain registrar (e.g., GoDaddy, Namecheap) and add an **A Record**:
- **Type:** `A`
- **Name:** `@` (or leave empty)
- **Value:** Your VPS IP Address (e.g., `72.61.169.195`)

#### B. VPS Reverse Proxy Configuration
Because port `80` is usually occupied by the default host server (CyberPanel, Apache, native Nginx), you must route incoming web traffic to Docker port `8282`.

**If you use CyberPanel / hPanel:**
1. Add the website `thenalandaexam.in`.
2. Set up a **Reverse Proxy / vHost** rule pointing to: `http://127.0.0.1:8282`

**If you use Native Nginx on your VPS:**
Create a new file `/etc/nginx/sites-available/thenalandaexam.in` and add:
```nginx
server {
    listen 80;
    server_name thenalandaexam.in www.thenalandaexam.in;

    location / {
        proxy_pass http://127.0.0.1:8282;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/thenalandaexam.in /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### 6. SSL / HTTPS Configuration (Optional but Recommended)
Brave, Chrome, and other modern browsers require HTTPS. If you see a "Connection is not private" error, you must install an SSL certificate.

The easiest way is to use **Certbot** on your VPS host:

1. **Install Certbot:**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```
2. **Generate and Install Certificate:**
   ```bash
   sudo certbot --nginx -d thenalandaexam.in -d www.thenalandaexam.in
   ```
3. **Follow the Prompts:**
   - Enter your email.
   - Agree to terms.
   - Select "Redirect all HTTP traffic to HTTPS" when asked.

Certbot will automatically update your host Nginx configuration (from Step 5B) to handle the secure HTTPS connection and forward it to your Docker container.

## Common Commands

- **Stop all services:** `docker compose down`
- **View backend logs:** `docker compose logs api --tail 50`
- **Restart a specific service:** `docker compose restart api`
- **Update code and rebuild:**
  ```bash
  git reset --hard HEAD
  git pull
  docker compose up --build -d
  ```

## Port Configuration Summary
- **Frontend Container (Nginx proxy):** 8282 (Host) / 80 (Container)
- **Backend API Container:** Not exposed to Host / 4000 (Internal Docker Network)
- **PostgreSQL Database:** 5423 (Host) / 5432 (Internal)