-- SQL: Comando para crear la tabla 'users'
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Suficientemente largo para un hash bcrypt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);