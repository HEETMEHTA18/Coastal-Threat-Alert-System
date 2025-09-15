import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import InteractiveDashboardRedux from './components/InteractiveDashboardRedux';
import LogoutPage, { LogoutSuccessPage } from './components/LogoutPage';
import ThemeProvider from './components/ThemeProvider';
import { useUI, useAuth } from './store/hooks';
import { setCurrentView, setAppLoading } from './store/slices/uiSlice';
import { initializeAuth, setDemoUser, logoutUser } from './store/slices/authSlice';
import { useInternetConnectivity } from './hooks/useConnectivity';

// ProtectedRoute component to handle authentication
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  if (!isAuthenticated) {
    return null; // Render nothing while redirecting
  }
  
  return children;
};

// Main App component
// Main App Wrapper
function AppWithRouter() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// App Content with access to router hooks
function AppContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useUI();
  const { user, isAuthenticated } = useAuth();

  // Initialize internet connectivity monitoring
  useInternetConnectivity();

  // Debug: Only log when authentication state changes
  const prevAuthState = useRef({ user, isAuthenticated, loading: loading.app });
  useEffect(() => {
    const hasChanged = 
      prevAuthState.current.user !== user ||
      prevAuthState.current.isAuthenticated !== isAuthenticated ||
      prevAuthState.current.loading !== loading.app;
    
    if (hasChanged) {
      console.log('🌊 CTAS Auth state changed:', { user, isAuthenticated, loading: loading.app });
      prevAuthState.current = { user, isAuthenticated, loading: loading.app };
    }
  }, [user, isAuthenticated, loading.app]);

  // Initialize app on load
  useEffect(() => {
    console.log('🌊 CTAS useEffect running with Redux...');
    
    const initializeApp = async () => {
      // Initialize authentication from localStorage
      console.log('🌊 About to dispatch initializeAuth...');
      dispatch(initializeAuth());
      
      // App initialization complete
      dispatch(setAppLoading(false));
      console.log('🌊 App loading set to false');
    };

    initializeApp();
  }, [dispatch]);

  // We've replaced all the handlers with direct navigate() calls in the Route components

  // Loading screen
  // Loading screen
  if (loading.app) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-2xl">🌊</span>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Loading CTAS</h2>
          <div className="w-32 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          <LandingPage 
            onGetStarted={() => navigate('/register')} 
            onLogin={() => navigate('/login')}
            onRegister={() => navigate('/register')}
          />
        } />
        <Route path="/login" element={<Login onBack={() => navigate('/')} />} />
        <Route path="/register" element={<Register onBack={() => navigate('/')} />} />
        <Route path="/logout-success" element={<LogoutSuccessPage onReturnHome={() => {
          localStorage.removeItem('ctas_user');
          localStorage.removeItem('ctas_token');
          localStorage.removeItem('session_start');
          navigate('/');
        }} />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <InteractiveDashboardRedux user={user} onLogout={() => navigate('/logout')} />
          </ProtectedRoute>
        } />
        <Route path="/logout" element={
          <ProtectedRoute>
            <LogoutPage 
              user={user} 
              onConfirmLogout={() => {
                dispatch(logoutUser());
                navigate('/logout-success');
              }} 
              onCancel={() => navigate('/dashboard')} 
            />
          </ProtectedRoute>
        } />
        
        {/* Protected tab routes for direct access */}
        <Route path="/dashboard/currents" element={
          <ProtectedRoute>
            <InteractiveDashboardRedux user={user} onLogout={() => navigate('/logout')} initialTab="currents" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/weather" element={
          <ProtectedRoute>
            <InteractiveDashboardRedux user={user} onLogout={() => navigate('/logout')} initialTab="weather" />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/satellite" element={
          <ProtectedRoute>
            <InteractiveDashboardRedux user={user} onLogout={() => navigate('/logout')} initialTab="satellite" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/reports" element={
          <ProtectedRoute>
            <InteractiveDashboardRedux user={user} onLogout={() => navigate('/logout')} initialTab="reports" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/analytics" element={
          <ProtectedRoute>
            <InteractiveDashboardRedux user={user} onLogout={() => navigate('/logout')} initialTab="analytics" />
          </ProtectedRoute>
        } />

        {/* Fallback for any other routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default AppWithRouter;
