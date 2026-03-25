-- Database setup script for 'propoly'
-- Run this in pgAdmin to create the database

-- Create database
CREATE DATABASE propoly;

-- Connect to the propoly database
\c propoly;

-- Example table creation (modify based on your needs)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feed_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_feed_items_author ON feed_items(author_id);
CREATE INDEX idx_feed_items_published ON feed_items(published);

-- Add comments
COMMENT ON TABLE users IS 'Users table for authentication and authorization';
COMMENT ON TABLE feed_items IS 'Feed items table for the feed system';

-- Display created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
