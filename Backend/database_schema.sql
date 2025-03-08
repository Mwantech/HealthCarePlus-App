-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS test_kits;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;


-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  can_manage_admins BOOLEAN DEFAULT FALSE
);

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table with CASCADE option
CREATE TABLE user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create doctors table
CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  availability TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  password VARCHAR(255),
  username VARCHAR(255)
);

-- Create appointments table with CASCADE option
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  patient_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  room_code VARCHAR(10) NOT NULL,
  issues LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL,
  shipping_address VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_details LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Pending',
  INDEX (order_number)
);

-- Create test_kits table
CREATE TABLE test_kits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Create order_items table with CASCADE options
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  test_kit_id INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (test_kit_id) REFERENCES test_kits(id) ON DELETE CASCADE
);

-- Add indexes for better performance
ALTER TABLE appointments ADD INDEX (doctor_id);
ALTER TABLE order_items ADD INDEX (order_id);
ALTER TABLE order_items ADD INDEX (test_kit_id);

-- Now with this schema, you can safely use:
-- TRUNCATE TABLE orders;
-- TRUNCATE TABLE test_kits;
-- TRUNCATE TABLE doctors;
-- Without encountering foreign key constraint errors