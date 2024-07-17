import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserTickets from './pages/UserTickets';
import Solicitacao from './pages/Solicitacoes';
import NoPermission from './pages/NoPermission';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AuthConsumer>
          {({ isAuthenticated, currentUser }) => (
            <>
              {isAuthenticated && <Navbar currentUser={currentUser} />}
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/usertickets"
                  element={
                    <ProtectedRoute>
                      <UserTickets />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/solicitacao"
                  element={
                    <ProtectedRoute allowedRoles={['Gerente', 'Supervisor']}>
                      <Solicitacao />
                    </ProtectedRoute>
                  }
                />
                <Route path="/nopermission" element={<NoPermission />} />
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
