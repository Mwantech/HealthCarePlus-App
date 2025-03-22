-- Create the database
CREATE DATABASE IF NOT EXISTS test_kit_orders;

-- Use the newly created database
USE test_kit_orders;

-- Create the test_kits table
CREATE TABLE IF NOT EXISTS test_kits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Create the orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipping_address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    test_kit_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (test_kit_id) REFERENCES test_kits(id)
);

-- Insert some sample test kits
INSERT INTO test_kits (name, price) VALUES
    ('COVID-19 Test Kit', 30.00),
    ('Blood Test Kit', 25.00),
    ('DNA Test Kit', 50.00);


-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    availability TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create health_issues table
CREATE TABLE IF NOT EXISTS health_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    symptoms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create telemedicine_pricing table
CREATE TABLE IF NOT EXISTS telemedicine_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    base_fee DECIMAL(10, 2) NOT NULL,
    additional_fee DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert initial telemedicine pricing (you can adjust these values)
INSERT INTO telemedicine_pricing (base_fee, additional_fee) VALUES (50.00, 1.00);

-- Add status column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';



-- Create Doctors table
CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  speciality VARCHAR(100) NOT NULL,
  experience VARCHAR(50),
  fee DECIMAL(10, 2) NOT NULL
);

-- Create Appointments table
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  patient_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  room_code VARCHAR(10) NOT NULL,
  issues JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Insert sample doctors
INSERT INTO doctors (name, speciality, experience, fee) VALUES
('Dr. Smith', 'General Practice', '10 years', 100.00),
('Dr. Johnson', 'Dermatology', '15 years', 150.00),
('Dr. Williams', 'Psychiatry', '12 years', 200.00);



-- Update the appointments table to add payment tracking fields

-- If the table already exists, alter it to add the needed columns
ALTER TABLE appointments 
ADD COLUMN payment_status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN checkout_request_id VARCHAR(100),
ADD COLUMN merchant_request_id VARCHAR(100),
ADD COLUMN transaction_id VARCHAR(100),
ADD COLUMN payment_details JSON,
ADD COLUMN payment_date TIMESTAMP NULL;

-- If you're creating the table from scratch, here's the full schema
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  issues JSON NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  room_code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  checkout_request_id VARCHAR(100),
  merchant_request_id VARCHAR(100),
  transaction_id VARCHAR(100),
  payment_details JSON,
  payment_date TIMESTAMP NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Create an index to improve performance when querying by payment status
CREATE INDEX idx_payment_status ON appointments (payment_status);

-- Create an index for checkout request ID to improve M-Pesa callback matching
CREATE INDEX idx_checkout_request_id ON appointments (checkout_request_id);