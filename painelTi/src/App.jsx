import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserForm from './pages/UserFormPage';
import Relatorio from './pages/Relatorio';
import Estoque from './pages/Estoque';
import Impressora from './pages/Impressora';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AuthConsumer>
          {({ isAuthenticated }) => (
            <>
              {isAuthenticated && <Navbar />}
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/userform"
                  element={
                    <ProtectedRoute>
                      <UserForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/relatorio"
                  element={
                    <ProtectedRoute>
                      <Relatorio />
                    </ProtectedRoute>
                  }
                />
                 <Route
                  path="/estoque"
                  element={
                    <ProtectedRoute>
                      <Estoque />
                    </ProtectedRoute>
                  }
                />
                 <Route
                  path="/impressora"
                  element={
                    <ProtectedRoute>
                      <Impressora />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
              </Routes>
            </>
          )}
        </AuthConsumer>
      </Router>
    </AuthProvider>
  );
};

const AuthConsumer = ({ children }) => {
  const authContext = useAuth();
  return children(authContext);
};

export default App;
