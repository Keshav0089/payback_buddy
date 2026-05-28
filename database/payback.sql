
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lender_name VARCHAR(100),
    borrower_name VARCHAR(100),
    borrower_email VARCHAR(100),
    amount DECIMAL(10,2),
    reason VARCHAR(255),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending'
);

CREATE TABLE reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT,
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);