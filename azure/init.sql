USE mnh_hospital_db;

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    age INT,
    gender VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    visit_date DATE,
    service VARCHAR(100),
    cost DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS billing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    total_amount DECIMAL(10,2),
    status VARCHAR(20)
);

INSERT INTO patients (name, age, gender) VALUES
('Rohith', 22, 'Male'),
('Anita', 30, 'Female');
