# ?? KisanSetu — The Bridge Between Farm and Table

> **KisanSetu bridges farmers and consumers directly without middlemen. Powered by Supabase & Node.js, featuring Google OAuth, real-time Socket.IO chat with request acceptance, geolocation-based nearby farmer discovery, order tracking, and an interactive 3D farm environment.**

---

Developed by **Cursed Coders** for **Smart India Hackathon (SIH)**.

---

## ? Features

- ?? **Interactive 3D Farmland & Bridge**: Realistic low-poly 3D WebGL experience built with Three.js (dynamic sky, sun, reflections, water, wind effects).
- ?? **Authentication & Roles**:
  - Email/Password authentication & **Sign In with Google** (via Supabase Auth & OAuth).
  - Role-based separation for **Farmers** and **Consumers**.
- ?? **Real-Time Chat & Request System**:
  - Send chat requests before connecting (Accept / Decline).
  - Bidirectional real-time messaging powered by **Socket.IO** with database persistence.
  - Search other users by name to connect.
- ?? **Nearby Farmer Geolocation Discovery**:
  - Distance calculation using Haversine algorithm based on coordinates/location.
  - Find the nearest local producers and chat with them directly.
- ????? **Farmer Dashboard**:
  - Crop product listing, price updates, real-time stock control.
  - Revenue, profit margin calculations, and 7-day sales breakdown.
  - Delivery status updates (Available / Out for delivery / Off duty) and status notes.
- ?? **Consumer Dashboard**:
  - Browse produce with filters, categories, and live farmer details.
  - Cart management and checkout flow with order history.
- ?? **Custom Profiles & Avatar Uploads**:
  - Upload profile photos with direct Supabase Storage integration.
  - Location, contact information, and address management.

---

## ??? Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Responsive Design System), JavaScript (ES6+), Three.js (WebGL)
- **Backend**: Node.js, Express.js, Socket.IO
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Auth, Storage)
- **Real-Time**: WebSockets via Socket.IO

---

## ?? Quick Start Guide

### 1. Clone the repository
\\\ash
git clone https://github.com/CristianoRonaldo070/KisanSetu.git
cd KisanSetu
\\\

### 2. Install dependencies
\\\ash
npm install
\\\

### 3. Configure Environment Variables
Create a \.env\ file in the root directory:
\\\env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=3000
\\\

### 4. Database Setup (Supabase)
Run the SQL script found in \supabase_schema.sql\ in your Supabase **SQL Editor** to create:
- Tables: \profiles\, \products\, \chat_requests\, \conversations\, \messages\, \orders\, \order_items\
- Storage bucket: \vatars\
- Automatic user triggers and Row Level Security (RLS) policies.

### 5. Run the Application
\\\ash
npm start
\\\
Visit **http://localhost:3000** in your browser.

---

## ?? Contact

- **Team**: Cursed Coders
- **Email**: cursedcoders0626@gmail.com
