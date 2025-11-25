# 🏡 Real Estate Analysis Chatbot

A full-stack web application that provides real-time analysis of real estate data using charts, growth metrics, filtering tools, and AI-generated summaries. The system helps users query trends such as price movement, demand changes, and locality comparisons.

---

## 📌 Overview

The Real Estate Analysis Chatbot allows users to ask natural-language questions related to real estate performance.  
The backend extracts the relevant locality and metrics, processes the dataset, and responds with:

- A textual summary generated using **Google Gemini**
- Yearly trend charts
- Growth calculations (absolute & percentage)
- A filtered data table for transparency

It aims to make raw data more accessible and interpretable for users, investors, or analysts.

---

## ⚙️ Key Features

### ✔ AI-Generated Summaries
- Uses **Google Gemini** to create concise explanations of price or demand trends.
- Supports contextual queries like:  
  “Show price growth for Akurdi over the last 3 years.”

### ✔ Interactive Visuals
- Line charts for price and demand trends using Recharts.
- Growth insights include:
  - Initial & final values  
  - Percentage change  
  - Trend direction (increasing / decreasing / stable)

### ✔ Data Tools
- Filter dataset by locality
- Compare trends between multiple areas
- Export filtered or full dataset as CSV

### ✔ Responsive UI
- Built with React  
- Animated backgrounds supported via WebGL  
- Clean and minimal layout suitable for dashboards or chat interfaces

---

## 🧩 Tech Stack

### **Frontend**
- React  
- Bootstrap  
- Recharts  
- Axios  
- Optional: WebGL (via OGL) for animated background

### **Backend**
- Django  
- Python  
- Pandas for data analysis  
- Google Gemini for summarization  
- Whitenoise for static file handling

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js  
- Python 3.10+  
- A valid Google Gemini API key  
- pip / npm installed

---

### **1. Clone the Repository**

```bash
git clone https://github.com/yourusername/real-estate-analysis-chatbot.git
cd real-estate-analysis-chatbot
2. Backend Setup
bash
Copy code
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# OR
source venv/bin/activate  # macOS/Linux

# Install required packages
pip install -r requirements.txt

# Add your Gemini key
echo GEMINI_API_KEY=your_api_key_here > .env

# Run migrations & start backend
python manage.py migrate
python manage.py runserver
Backend runs at:

cpp
Copy code
http://127.0.0.1:8000
3. Frontend Setup
bash
Copy code
cd frontend

npm install
npm start
Frontend runs at:

arduino
Copy code
http://localhost:3000
💬 Example Queries
"Give me an analysis of Wakad"

"Compare price trends in Aundh and Baner"

"Show demand trend for Kharadi over the last 3 years"

"Which locality is performing best this year?"

"Download data" (or click the download button)

📦 Deployment
Frontend:
Deploy on Vercel (Create React App is auto-detected)

Backend:
Deploy on Render or any Python-compatible server

For production, update:

js
Copy code
const API_BASE = "https://your-backend.onrender.com";
in:

bash
Copy code
frontend/src/App.js
🤝 Contributing
Fork the project

Create a feature branch:
git checkout -b feature/Enhancement

Commit changes:
git commit -m "Add improvement"

Push to the branch

Submit a pull request

📄 License
This project is licensed under the MIT License.

<div align="center">Built with care by [Your Name]</div> ```
