import React from "react";
import { useAuth } from "../../App";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
  };

  return (
    <header className="w-full p-4 bg-blue-600 text-white font-bold text-xl shadow flex items-center justify-between">
      <span>Kanban Board</span>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 font-semibold px-4 py-1 rounded hover:bg-blue-100 transition"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
