# AgroVision AI: Smart Crop Yield Prediction & Marketplace System

AgroVision AI is a comprehensive full-stack ecosystem designed to empower the agricultural community. It bridges the gap between AI-driven field insights for farmers and an efficient marketplace for sellers.

## 🚀 Project Modules

### 👨‍🌾 1. Farmer Side (AgroVision Dashboard)
Empowers farmers with real-time diagnostics and smart assistance.
*   **AI Diagnostics**: Image-based analysis for Soil health, Pest detection, and Vegetation monitoring.
*   **Jarvis AI**: A floating assistant powered by Google Gemini 1.5 Flash for expert agricultural advice.
*   **Smart Marketplace**: Integrated UI to browse and order seeds, fertilizers, and tools directly from the dashboard.
*   **Field Management**: Real-time weather tracking, GPS-based mapping, and yield prediction charts.
*   **Secure Profile**: Detailed farm history tracking and OTP-verified account security.

### 🏪 2. Seller Side (AgroMarket)
A dedicated portal for vendors to manage their agricultural business.
*   **Inventory Management**: Tools to list, edit, and delete agricultural products.
*   **Order Tracking**: Real-time order management with status updates (Pending, Shipped, Delivered).
*   **Seller Dashboard**: Insights into sales and profile management with secure OTP authentication for sensitive changes.

## 🛠️ Tech Stack

*   **Backends**: Dual Python (Flask) servers.
*   **Database**: Supabase (PostgreSQL) for unified data storage across both platforms.
*   **AI/ML**: Scikit-Learn (Joblib) for local models and Google Gemini API for LLM features.
*   **Frontend**: Neumorphic UI Design, HTML5, CSS3, JavaScript (ES6+), GSAP (Animations), Vanta.js (3D Graphics).
*   **Security**: Bcrypt password hashing and `smtplib` for OTP-based verification.

---

## ⚙️ Setup & Configuration

### 1. Prerequisites
*   Python 3.9+ installed.
*   A Supabase Project (URL and API Key).
*   Google AI Studio API Key (for the Gemini assistant).

### 2. Environment Variables
Create a `.env` file in **both** the `/Farmer side/` and `/seller side for market/backend/` folders:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-key
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
```
*Note: For `SMTP_PASS`, use a Google App Password, not your regular Gmail password.*

### 3. Gemini API Key
In the file `frontend/scripts/dashboard.js`, locate the constant `GEMINI_API_KEY` and replace the placeholder with your actual API key from the Google AI Studio.

```javascript
const GEMINI_API_KEY = "YOUR_ACTUAL_API_KEY_HERE";
```

### 4. Database Setup
1.  Go to your Supabase Dashboard.
2.  Open the **SQL Editor**.
3.  Copy the contents of `backend/database_schema.sql` and run it to create the necessary tables (`Client`, `products`, `orders`, `order_items`).

### 5. ML Models
The application dynamically loads models from the `/ML` folder. 
1.  Create a folder named `ML` in the project root.
2.  Place your `.pkl` or `.joblib` files inside. The app specifically looks for filenames containing `pest_model` and `vegetation_model` for specific routes.

---

## 🏃 How to Run

Follow these commands in your terminal:

### Step 1: Clone the repository
```bash
git clone <your-repo-url>
cd <project-folder-name>
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Start the Backend Server
```bash
python app.py
```
The server will start at `http://127.0.0.1:5000`.

### Step 4: Access the Frontend
Open your browser and go to `http://127.0.0.1:5000/`. The Flask server is configured to serve the `login.html` as the entry point.

---

## 📂 Project Structure
*   `/backend`: Database schemas and mailing logic.
*   `/frontend`: UI components, styles, and dashboard logic.
*   `/ML`: Store your trained Machine Learning models here.
*   `app.py`: The main Flask entry point handling API routes and model inference.