# 🚀 Opportunity-Hub

[![SaaS Status](https://img.shields.io/badge/Status-Stable-success?style=for-the-badge)](https://github.com/Ailover123/Opportunity-Hub)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/Stack-React_|_Node_|_SQLite-61DAFB?style=for-the-badge)](https://github.com/Ailover123/Opportunity-Hub)

**Opportunity-Hub** is an intelligent SaaS platform designed to bridge the gap between ambitious students/professionals and their next big break. It aggregates, ranks, and manages career-defining opportunities—from global hackathons and internships to specialized certifications and high-growth job roles—all in one unified, data-driven dashboard.

---

## ✨ Key Features (Current)

### 🕵️ Intelligent Aggregation
*   **Multi-Platform Scrapers**: automated data extraction from **Indeed**, **Coursera**, **Kaggle**, **Devpost**, and more.
*   **Real-time Intel Sync**: On-demand "Sync Intel" triggers that fetch the latest shifts in the opportunity landscape.
*   **Worker Progress Tracking**: Live socket-based updates showing scraping progress and results.

### 🧠 Smart Scoring Engine
*   **Engineering Profile Match**: Uses a custom scoring algorithm to rank opportunities based on your skills (React, Node, ML, etc.) and interests.
*   **Priority Ranking**: Automatically promotes the best-fit opportunities to the top of your dashboard.
*   **Feedback Loop**: Captures "Applied Intent" tags (Better Fit, Near Deadline) to refine future recommendations.

### 📊 Professional SaaS Dashboard
*   **Data Visualization**: Integrated **Recharts** to visualize opportunity trends, platform distribution, and match scores.
*   **Tiered Access**: Full-featured billing infrastructure supporting **Free**, **Pro**, and **Team** tiers.
*   **Activity Logs**: A "System Node" audit trail tracking all intelligence logs and status updates.

### 📂 Cloud & Productivity Integration
*   **Google Drive Sync**: Automate exports of your shortlisted opportunities directly to Google Drive.
*   **Real-time Collaboration**: WebSocket-powered "Team" rooms for sharing intelligence and sync notifications.
*   **Export Ready**: One-click CSV exports for offline management.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Material UI (MUI), Framer Motion, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | Node.js, Express, Socket.io, Node-cron, JWT |
| **Data & Scraping** | SQLite (Production), Puppeteer, Cheerio, Axios |
| **Integrations** | Google Drive API, Razorpay, Stripe |
| **Dev Tools** | Vitest, ESLint, Nodemon |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **pnpm**

### 2. Clone the Repository
```bash
git clone https://github.com/Ailover123/Opportunity-Hub.git
cd Opportunity-Hub
```

### 3. Installation
Install dependencies for both frontend and backend:

**Backend Setup:**
```bash
cd dashboard/backend
npm install
```

**Frontend Setup:**
```bash
cd ../ # Move to dashboard root
npm install
```

### 4. Configuration
Create a `.env` file in `dashboard/backend` and add the following:
```env
PORT=3001
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Optional Integrations
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...
RAZORPAY_KEY_ID=...
```

### 5. Running the App
Open two terminals:

**Terminal 1 (Backend):**
```bash
cd dashboard/backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd dashboard
npm run dev
```

Access the dashboard at `http://localhost:5173`.

---

## 🔮 Future Scope

- [ ] **AI-Powered Recommendations**: Deep learning models for hyper-personalized opportunity matching.
- [ ] **Expanded Scraper Library**: Native support for LinkedIn, Unstop, and regional job boards.
- [ ] **Mobile Companion App**: Flutter or React Native app for on-the-go notifications and applications.
- [ ] **Community Hub**: Integrated forums for team formation and interview prep sharing.
- [ ] **Automated Applications**: One-click application filling using stored profile metadata.

---

## 🛠️ Project Structure
```text
Opportunity-Hub/
├── dashboard/
│   ├── backend/          # Express API, Scrapers, Workers
│   │   ├── scrapers/     # Individual platform scraper logic
│   │   ├── src/          # Backend core logic (API, Services, Utils)
│   │   └── server.js     # Main entry point
│   ├── src/              # React components, pages, hooks
│   │   ├── features/     # Feature-based logic (Dashboard, Opportunities)
│   │   ├── components/   # Shared UI components
│   │   └── pages/        # Route-level views
│   └── vite.config.js    # Frontend configuration
├── test-scoring.js       # Standalone engine test script
└── render.yaml           # Deployment configuration
```

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.

