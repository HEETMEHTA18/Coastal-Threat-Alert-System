# 🌊 Coastal Threat Alert System (CTAS)

A comprehensive AI-powered platform for real-time coastal threat assessment and monitoring, integrating satellite imagery, weather data, and machine learning models to provide early warning systems for coastal communities.

## 🌊 Overview

CTAS combines cutting-edge AI/ML technologies with real-time environmental data to assess and predict coastal threats including:
- Storm surge predictions
- Coastal erosion monitoring
- Mangrove ecosystem health assessment
- Sea level rise analysis
- Extreme weather pattern detection

## 🏗️ Project Structure

```
CTAS/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── utils/             # Utility functions
│   │   └── assets/            # Static assets
│   └── public/                # Public assets
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Custom middleware
│   │   └── config/            # Configuration files
│   └── tests/                 # Backend tests
├── ai-models/                  # Python AI/ML models
│   ├── models/                # ML model files
│   ├── data/                  # Training data
│   ├── scripts/               # Utility scripts
│   └── api/                   # AI API service
├── shared/                     # Shared utilities
│   ├── types/                 # TypeScript definitions
│   ├── constants/             # Shared constants
│   └── utils/                 # Shared utilities
├── docs/                       # Documentation
│   ├── api/                   # API documentation
│   ├── deployment/            # Deployment guides
│   └── user-guide/            # User documentation
├── infrastructure/             # Infrastructure as code
│   ├── docker/                # Docker configurations
│   ├── kubernetes/            # K8s manifests
│   └── terraform/             # Terraform configs
└── tools/                      # Development tools
    ├── scripts/               # Build/deployment scripts
    └── configs/               # Tool configurations
```

## 🚀 Features

### Frontend (React + Vite)
- **Modern UI/UX**: Glassmorphism design with responsive layouts
- **Real-time Dashboard**: Live threat monitoring and alerts
- **Interactive Maps**: Satellite imagery integration with threat overlays
- **Mobile Responsive**: Optimized for all device types
- **PWA Support**: Offline capabilities for critical functions

### Backend (Node.js + Express)
- **RESTful API**: Comprehensive API for all system functions
- **Real-time WebSockets**: Live data streaming and notifications
- **Authentication**: JWT-based secure authentication
- **Database**: MongoDB with optimized schemas
- **Caching**: Redis for performance optimization
- **Rate Limiting**: API protection and abuse prevention

### AI/ML Models (Python)
- **Mangrove Health Assessment**: Random Forest-based ecosystem monitoring
- **Coastal Threat Prediction**: Multi-model ensemble for threat detection
- **Satellite Image Analysis**: CNN-based image processing
- **Weather Pattern Recognition**: Time series analysis for extreme weather
- **Anomaly Detection**: Real-time outlier detection in environmental data

## 🛠️ Technology Stack

### Frontend
- **React 18**: Component-based UI framework
- **Vite**: Fast build tool and dev server
- **TailwindCSS v4**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls

## 🔑 API Credentials & Environment Setup

For security reasons, API credentials should be stored in environment variables.

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed instructions on setting up your environment variables and API credentials.

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Redis**: In-memory data store
- **JWT**: JSON Web Tokens for authentication
- **WebSocket**: Real-time communication

### AI/ML
- **Python 3.9+**: Programming language
- **scikit-learn**: Machine learning library
- **TensorFlow**: Deep learning framework
- **OpenCV**: Computer vision library
- **NumPy/Pandas**: Data manipulation
- **Geospatial Libraries**: GDAL, Rasterio, Shapely

### DevOps & Infrastructure
- **Docker**: Containerization
- **Kubernetes**: Container orchestration
- **Terraform**: Infrastructure as code
- **GitHub Actions**: CI/CD pipeline
- **Nginx**: Reverse proxy and load balancer

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **Python** 3.9 or higher
- **MongoDB** 5.0 or higher
- **Redis** 6.0 or higher
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/CTAS.git
cd CTAS
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
# Add your API keys, database URLs, etc.
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 5. AI Models Setup
```bash
cd ai-models
pip install -r requirements.txt
python api/app.py
```

## 🔧 Configuration

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/coastal-threat-db
REDIS_URL=redis://localhost:6379

# API Keys
OPENWEATHER_API_KEY=your_api_key
NASA_API_KEY=your_api_key
SENTINEL_API_KEY=your_api_key

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# AI Service
PYTHON_AI_SERVICE_URL=http://localhost:8000
```

### API Keys Required
- **OpenWeatherMap**: Weather data and forecasts
- **NASA Earth Data**: Satellite imagery and datasets
- **Copernicus/Sentinel**: European satellite data
- **Twilio**: SMS/WhatsApp notifications (optional)

## 📖 API Documentation

### Authentication Endpoints
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/refresh     # Token refresh
```

### Data Endpoints
```
GET  /api/threats          # Get threat assessments
POST /api/reports          # Submit field reports
GET  /api/weather          # Weather data
GET  /api/satellite        # Satellite imagery
```

### AI Model Endpoints
```
POST /api/ai/predict       # Run predictions
GET  /api/ai/models        # Available models
POST /api/ai/retrain       # Retrain models
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:coverage
```

### Backend Tests
```bash
cd backend
npm run test
npm run test:integration
```

### AI Model Tests
```bash
cd ai-models
python -m pytest tests/
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run all services
docker-compose up -d

# Scale specific services
docker-compose up -d --scale backend=3
```

### Kubernetes Deployment
```bash
# Apply all manifests
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods -n ctas
```

## 📊 Monitoring & Observability

- **Application Metrics**: Prometheus + Grafana dashboards
- **Logging**: Centralized logging with ELK stack
- **Error Tracking**: Sentry integration
- **Uptime Monitoring**: Health checks and alerts
- **Performance**: APM with detailed traces

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow ESLint/Prettier configurations
- Write tests for new features
- Update documentation
- Follow semantic versioning

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙋‍♂️ Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/CTAS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/CTAS/discussions)
- **Email**: support@ctas-project.org

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic threat assessment system
- ✅ Weather data integration
- ✅ Simple ML models
- ✅ Web dashboard

### Phase 2 (Next Quarter)
- 🔄 Advanced AI models
- 🔄 Mobile applications
- 🔄 Real-time alerts
- 🔄 Community reporting

### Phase 3 (Future)
- 📋 IoT sensor integration
- 📋 Drone surveillance
- 📋 Blockchain verification
- 📋 Global deployment

## 🌟 Acknowledgments

- **NASA Earth Science Division** for satellite data access
- **Copernicus Programme** for Sentinel imagery
- **OpenWeatherMap** for weather APIs
- **Open Source Community** for amazing tools and libraries

---

**Built with ❤️ for coastal communities worldwide**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
