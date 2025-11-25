#  Real Estate Analysis Chatbot

A full-stack web application that provides real-time analysis of real estate data using charts, growth metrics, filtering tools, and AI-generated summaries. The system helps users query trends such as price movement, demand changes, and locality comparisons.


---

##  Overview

The Real Estate Analysis Chatbot allows users to ask natural-language questions related to real estate performance.  
The backend extracts the relevant locality and metrics, processes the dataset, and responds with:

- AI-generated summaries (via Google Gemini)  
- Year-wise price or demand trends  
- Comparison charts between multiple locations  
- Growth metrics (absolute & percentage change)  
- A filtered data table for transparency  
- One-click CSV downloads  

It is designed to make raw real estate data easier to understand for users, analysts, and investors.

---

##  Key Features

###  AI-Powered Insights
- Uses **Google Gemini 2.5 Flash** to summarize real estate trends.
- Understands contextual follow-up questions.
- Supports queries like:
  - “Show price growth for Akurdi over the last 3 years.”
  - “What about demand?”

###  Dynamic Visualizations
- Interactive charts using **Recharts**
- Displays:
  - Price trends  
  - Demand trends  
  - Comparative charts  
- Growth calculations:
  - Initial vs final value  
  - Absolute change  
  - Percentage change  
  - Classification: increasing / decreasing / stable  

###  Data Export Tools
- Download filtered location-specific datasets  
- Download the entire database with one click  

###  UI/UX
- Clean, modern interface  
- Optional animated WebGL background (via `ogl`)  
- Fully responsive for desktop & mobile  

---

##  Tech Stack

### **Frontend**
| Technology | Purpose |
|----------|---------|
| React | UI Framework |
| Bootstrap | Layout Components |
| Recharts | Data Visualization |
| Axios | API Communication |
| OGL (Optional) | WebGL Background Effects |

### **Backend**
| Technology | Purpose |
|----------|---------|
| Django | Web Framework |
| Python | Backend Language |
| Pandas | Data Manipulation |
| Google Gemini API | AI Summaries |
| Whitenoise | Static File Handling |

---

## ⚡ Getting Started

### **Prerequisites**
- Node.js  
- Python 3.10+  
- Google Gemini API Key  

---

## 1.  Clone the Repository

```bash
git clone https://github.com/yourusername/real-estate-analysis-chatbot.git
cd real-estate-analysis-chatbot
```

## 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# OR
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Add your Gemini key
echo GEMINI_API_KEY=your_api_key_here > .env

# Run migrations
python manage.py migrate

# Start backend
python manage.py runserver
```

**Backend runs at:** `http://127.0.0.1:8000`

## 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

**Frontend runs at:** `http://localhost:3000`

---

## 💬 Example Queries

- *"Give me an analysis of Wakad"*
- *"Compare price trends in Aundh and Baner"*
- *"Show demand trend for Kharadi over the last 3 years"*
- *"Which locality is performing best this year?"*
- *"Download data"*

---

##  Deployment
This web-app is also deployed using Vercel+Render. You can access it using the below link :  
https://real-estate-analysis-chatbot-delta.vercel.app/
