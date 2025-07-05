import React, { useState, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";

import "./App.css";
import KanbanViewPage from "./pages/KanbanViewPage";
import TaskHistoryPage from "./pages/TaskHistoryPage";

// Auth context and hooks
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Protected route wrapper
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("isAuthenticated")
  );

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <div>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<KanbanViewPage />} />
              <Route path="/taskhistory" element={<TaskHistoryPage />} />
            </Route>
          </Routes>
        </Router>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
