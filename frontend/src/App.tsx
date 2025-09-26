import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Main Dashboard - All functionality in one page */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/themes" element={<Navigate to="/dashboard" replace />} />
            <Route path="/versions" element={<Navigate to="/dashboard" replace />} />
            <Route path="/events" element={<Navigate to="/dashboard" replace />} />
            <Route path="/locations" element={<Navigate to="/dashboard" replace />} />
            <Route path="/repertoires" element={<Navigate to="/dashboard" replace />} />
            <Route path="/upload" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </MuiThemeProvider>
  );
}

export default App;