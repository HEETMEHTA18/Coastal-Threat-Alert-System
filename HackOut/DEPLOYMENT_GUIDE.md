# 🌊 CTAS Deployment Guide

## Quick Deployment

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 80, 5000, and 8000 available

### One-Click Deployment

**Windows:**
```bash
./deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment

1. **Clone and Navigate:**
   ```bash
   git clone <repository-url>
   cd CTAS/HackOut
   ```

2. **Environment Setup:**
   ```bash
   # Copy environment files
   cp frontend/.env.production frontend/.env
   cp backend/.env.production backend/.env
   ```

3. **Deploy:**
   ```bash
   docker-compose up -d --build
   ```

4. **Verify:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:8000

## Production Configuration

### Environment Variables

**Frontend (.env.production):**
- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket URL
- `NODE_ENV`: production

**Backend (.env.production):**
- `NODE_ENV`: production
- `MONGODB_URI`: Database connection
- `JWT_SECRET`: Secure JWT secret
- `CORS_ORIGIN`: Frontend URL

### Security Considerations

1. **Change default secrets:**
   - Update `JWT_SECRET` in backend/.env.production
   - Use strong MongoDB passwords

2. **Enable HTTPS:**
   - Configure SSL certificates
   - Update CORS settings

3. **Database Security:**
   - Use MongoDB Atlas or secure self-hosted instance
   - Enable authentication and encryption

## Platform-Specific Deployment

### Docker Hub
```bash
# Tag and push images
docker tag hackout_frontend your-registry/ctas-frontend:latest
docker tag hackout_backend your-registry/ctas-backend:latest
docker push your-registry/ctas-frontend:latest
docker push your-registry/ctas-backend:latest
```

### Heroku
```bash
# Install Heroku CLI and login
heroku create ctas-app
heroku container:push web --app ctas-app
heroku container:release web --app ctas-app
```

### AWS/GCP/Azure
- Use container services (ECS, Cloud Run, Container Instances)
- Configure load balancers and databases
- Set up CI/CD pipelines

### DigitalOcean/Vercel/Netlify
- Frontend: Deploy to Vercel/Netlify
- Backend: Deploy to DigitalOcean App Platform

## Monitoring and Maintenance

### Health Checks
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Check individual services
curl http://localhost:5000/api/health
```

### Backup
```bash
# Backup MongoDB
docker exec mongodb mongodump --out /backup

# Backup uploaded files
docker cp backend_container:/app/uploads ./backup/uploads
```

### Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :80
   ```

2. **Memory issues:**
   ```bash
   # Increase Docker memory allocation
   # Docker Desktop > Settings > Resources
   ```

3. **Database connection:**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   ```

### Performance Optimization

1. **Enable caching:**
   - Configure Redis for session storage
   - Enable browser caching in nginx

2. **Database optimization:**
   - Add indexes for frequently queried fields
   - Use MongoDB connection pooling

3. **Frontend optimization:**
   - Enable gzip compression
   - Use CDN for static assets

## Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all services are running
4. Check network connectivity between services

🌊 **CTAS is now ready for production deployment!**
