-- Database setup script for Star Ratings College
-- Run this script in PostgreSQL as a superuser (usually postgres)

-- Create the database
CREATE DATABASE star_ratings_college;

-- Create the application user
CREATE USER app_user WITH PASSWORD 'app_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE star_ratings_college TO app_user;

-- Connect to the database and grant schema privileges
\c star_ratings_college;

-- Grant usage on schema and all tables to the user
GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;