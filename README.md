# Payback Buddy 💸

A web-based loan tracking and payment service that helps users record loans given or taken, monitor repayment schedules, and keep track of outstanding balances — all in one place.

## 📌 Overview

Payback Buddy was built to solve a simple everyday problem: informal loans between friends and family are easy to lose track of. This app lets users log who owes what, mark repayments as they happen, and see a clear, up-to-date picture of their lending and borrowing activity.

## ✨ Features

- **Add loan records** — log loans given or taken, with amount, party name, and date
- **Track repayment status** — mark loans as paid, partially paid, or pending
- **View outstanding balances** — see a running total of what's owed to you and what you owe
- **Edit & delete records** — keep loan entries accurate as situations change
- **Responsive UI** — usable across desktop and mobile screen sizes

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | PHP |
| Database | MySQL |

## 🗂️ Project Structure

```
payback-buddy/
├── index.php          # Dashboard / loan overview
├── add_loan.php       # Add a new loan record
├── edit_loan.php      # Edit an existing loan record
├── delete_loan.php    # Delete a loan record
├── db.php             # Database connection config
├── css/
│   └── style.css      # Stylesheets
├── js/
│   └── script.js      # Frontend interactivity
└── README.md
```

> Note: adjust the file/folder names above to match your actual project if they differ.

## 🚀 Getting Started

### Prerequisites
- PHP 7.4+ and a local server environment (XAMPP / WAMP / MAMP, or PHP's built-in server)
- MySQL
- A web browser

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/<your-username>/payback-buddy.git
   cd payback-buddy
   ```

2. Create a MySQL database (e.g. `payback_buddy_db`) and import the schema, if you have a `.sql` file:
   ```bash
   mysql -u root -p payback_buddy_db < schema.sql
   ```

3. Update database credentials in `db.php`:
   ```php
   $host = "localhost";
   $user = "root";
   $password = "";
   $dbname = "payback_buddy_db";
   ```

4. Start your local server (e.g. via XAMPP, or PHP's built-in server):
   ```bash
   php -S localhost:8000
   ```

5. Open `http://localhost:8000` in your browser.

## 🖼️ Screenshots

> Add screenshots of the dashboard, add-loan form, and repayment tracker here.

## 🔮 Future Improvements

- User authentication (login/signup per user)
- Email/SMS reminders for upcoming repayment dates
- Exportable repayment reports (PDF/CSV)
- Charts/graphs for lending vs. borrowing trends

## 👤 Author

**Keshav**
📧 singlakeshav84@gmail.com
