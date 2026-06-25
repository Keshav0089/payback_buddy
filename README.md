# PayBack Buddy 💸

**A peer-to-peer loan tracking and recovery system.**

PayBack Buddy helps people keep track of informal loans between friends and family — who owes whom, how much, and when it's due — with built-in online payments and automated reminders so nothing falls through the cracks.


---

## ✨ Features

- **Dual-tab Dashboard** — separate views for *Money I Lent* and *Money I Owe*, with loans automatically matched between lender and borrower via `user_id` and email.
- **Google OAuth Login** — sign in with Google via Firebase, with automatic user registration on first login.
- **Online Repayments** — pay back loans (in full or in part) directly through the app using Razorpay, with HMAC-SHA256 signature verification for secure, tamper-proof transactions.
- **Automated Email Reminders** — a cron-driven PHP script (`autoReminder.php`) nudges borrowers about upcoming or overdue payments without manual follow-up.
- **PDF Receipts** — every payment generates a downloadable PDF receipt via jsPDF.
- **Premium UI** — a dark, glassmorphism-themed interface across Home, Login, Register, and Dashboard pages, built with the Syne and DM Sans fonts, animated background orbs, and gradient text accents.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | PHP |
| Database | MySQL |
| Authentication | Firebase (Google OAuth) |
| Payments | Razorpay |
| Local Dev Environment | XAMPP |
| PDF Generation | jsPDF |

---

## 📋 Prerequisites

- [XAMPP](https://www.apachefriends.org/) (Apache + MySQL + PHP)
- [Node.js](https://nodejs.org/) and npm (for the React frontend)
- A [Firebase](https://firebase.google.com/) project with Google sign-in enabled
- A [Razorpay](https://razorpay.com/) account (test mode is fine for development)

---

## 🚀 Getting Started

### 1. Set up the database

1. Start **Apache** and **MySQL** from the XAMPP control panel.
2. Open phpMyAdmin and create a database (e.g. `payback_buddy`).
3. Import the provided SQL schema to set up the required tables (users, loans, payments, etc.). Make sure each loan record is associated with a `user_id` so dashboards correctly separate data between users.

### 2. Configure the backend

1. Copy the PHP backend files into your XAMPP `htdocs` directory.
2. Update the database connection credentials in the PHP config file to match your local MySQL setup.
3. Add your Razorpay **Key ID** and **Key Secret** (test mode keys are fine) to the payment handler config.
4. Add your Firebase project config (API key, auth domain, project ID) for OAuth verification.

### 3. Configure the frontend

```bash
cd frontend
npm install
npm start
```

Update the API base URL in the frontend config to point to your local PHP backend (e.g. `http://localhost/payback-buddy/api`).

### 4. Set up automated reminders (optional)

`autoReminder.php` is designed to be run on a schedule (e.g. via Windows Task Scheduler or cron) to email borrowers about upcoming/overdue payments. Point it at your mail-sending configuration and schedule it to run daily.

---

## 🧪 Testing Payments

Use Razorpay's test mode credentials:

| Method | Test Value |
|---|---|
| Card (India) | `5267 3181 8797 5449` |
| UPI | `success@razorpay` |

> ⚠️ International test cards (e.g. `4111 1111 1111 1111`) **do not work** in Indian Razorpay test mode — use the Indian test card or UPI ID above.

---

## 📁 Project Structure

```
payback-buddy/
├── frontend/              # React.js application
│   ├── src/
│   │   ├── pages/         # Home, Login, Register, Dashboard
│   │   ├── components/
│   │   └── ...
├── backend/                # PHP API
│   ├── api/                # Endpoints (loans, payments, auth)
│   ├── autoReminder.php    # Cron job for email reminders
│   └── config/
└── database/
    └── schema.sql
```

---

## 🐞 Known Issues & Fixes (Dev Notes)

A few bugs came up during development — useful to know if you're extending this project:

- **Shared dashboard bug:** Loans without a `user_id` caused all users to see the same data. Fixed by enforcing user association at the schema level.
- **SQL injection risk:** Raw SQL queries were replaced with MySQLi prepared statements throughout.
- **React hooks warning:** Resolved with proper use of `useCallback` and `useRef`.
- **"Objects are not valid as a React child" error:** Caused by a ternary rendering loans where only one branch used `.map()`. Both array branches need `.map()`.
- **Resetting the local database:** If you need a clean slate, stop MySQL, delete the `payback_buddy` folder from `C:\xampp\mysql\data\`, then restart MySQL to rebuild from schema.

---

## 📄 License

Academic project — for educational/demonstration purposes.
