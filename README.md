
# 🌊 Coastal Guardian

[![GitHub Repo](https://img.shields.io/badge/GitHub-Coastal--Threat--Alert--System-blue?logo=github)](https://github.com/HEETMEHTA18/Coastal-Threat-Alert-System)
<!-- 
**GitHub Repository:** [https://github.com/HEETMEHTA18/Coastal-Threat-Alert-System](https://github.com/HEETMEHTA18/Coastal-Threat-Alert-System) -->

**Coastal Guardian** is a comprehensive, AI-powered platform for real-time coastal threat assessment and monitoring. It integrates satellite imagery, weather data, and machine learning models to provide early warning systems and actionable insights for coastal communities.

---

## 🌟 Features

- Real-time threat detection and alerts (storms, erosion, sea level rise, etc.)
- Interactive dashboard with live maps and analytics
- Community reporting and alert system
- AI/ML-powered environmental analysis (Python models)
- Secure authentication and user management
- Mobile responsive, modern UI/UX
- RESTful API and real-time WebSocket support

---


## 🛠️ Technology Stack

### Frontend
- React 18 (with Vite)
- TailwindCSS
- Lucide React (icons)
- React Router
- Redux Toolkit
- Axios

### Backend
- Node.js
- Express.js
- PostgreSQL & Neon Database
- Prisma ORM (with custom runtime emulator fallback)
- JWT (authentication)
- WebSocket (real-time, optional)

### AI/ML
- Python 3.9+
- scikit-learn
- TensorFlow
- OpenCV
- NumPy, Pandas
- Gemini Multimodal API

### DevOps & Tooling
- Docker
- GitHub Actions (CI/CD)


---

## 📁 Project Structure

```
Coastal-Guardian/
├── frontend/      # React app (UI)
│   ├── src/
│   └── public/
├── backend/       # Node.js/Express API (PostgreSQL + Prisma)
│   ├── src/
│   └── scripts/
├── ai-models/     # Python ML models & APIs
│   ├── *.py
│   └── requirements.txt
└── docs/          # Documentation
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/HEETMEHTA18/Coastal-Threat-Alert-System
cd frontend ; npm run dev ;  cd backend ; npm run dev 
```

### 2. Environment Setup
Copy `.env.example` to `.env` in both `backend/` and `frontend/`, then add your API keys and secrets.

### 3. Install & Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Install & Run Backend
```bash
cd backend
npm install
npx prisma generate  # generates local types
npm run dev
```

### 5. AI Models (Optional)
```bash
cd ai-models
pip install -r requirements.txt
python api/app.py
```

---

## 🔑 Environment Variables

See `.env.example` in each folder for required variables:

- `DATABASE_URL`, `JWT_SECRET`, `OPENWEATHER_API_KEY`, `GEMINI_API_KEY`, etc.
- **Never commit real secrets to GitHub!**

---

## 📖 API Overview

**Auth:**
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login

**Threats & Data:**
- `GET /api/threats` — Get threat assessments
- `POST /api/reports` — Submit field reports
- `GET /api/weather` — Weather data
- `GET /api/satellite` — Satellite imagery

**AI Models:**
- `POST /api/ai/predict` — Run predictions
- `GET /api/ai/models` — List models

---

## 🧪 Testing

**Frontend:**
```bash
cd frontend
npm run test
```

**Backend:**
```bash
cd backend
npm run test
```

**AI Models:**
```bash
cd ai-models
python -m pytest
```

---

## 📝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit and push
4. Open a pull request

**Guidelines:**
- Use ESLint/Prettier for JS code
- Write tests for new features
- Update docs as needed

---

## 📄 License

MIT License — see [LICENSE.md](LICENSE.md)

---

## 🙏 Acknowledgments

- NASA Earth Science Division
- Copernicus Programme
- OpenWeatherMap
- Open Source Community

---

**Built with ❤️ for coastal communities worldwide**
