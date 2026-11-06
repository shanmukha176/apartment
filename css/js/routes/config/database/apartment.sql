CREATE DATABASE IF NOT EXISTS apartment_maintenance_db;

USE apartment_maintenance_db;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    apartment_no VARCHAR(20),
    role ENUM('resident','admin','staff') DEFAULT 'resident',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE maintenance_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    priority ENUM('Low','Medium','High') DEFAULT 'Medium',
    status ENUM('Pending','In Progress','Completed','Rejected')
        DEFAULT 'Pending',
    assigned_to INT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_date DATETIME NULL,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

CREATE TABLE request_updates (
    update_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    updated_by INT NOT NULL,
    status VARCHAR(30),
    remarks TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (request_id) REFERENCES maintenance_requests(request_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

INSERT INTO categories (category_name, description) VALUES
('Plumbing', 'Water leakage and pipe problems'),
('Electrical', 'Electrical repairs'),
('Cleaning', 'Apartment cleaning'),
('Water Supply', 'Water supply problems'),
('Lift Repair', 'Elevator maintenance');