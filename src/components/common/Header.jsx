import React from "react";
import { useAuth } from "../../App";
import ThemeToggle from "./ThemeToggle";

const Header = ({ onSidebarOpen }) => {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
  };

  return (
    <header className="w-full bg-blue-600 text-white font-bold shadow">
      <div className="max-w-screen-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Hamburger icon for small screens */}
          <button
            className="md:hidden p-2 rounded bg-blue-700 hover:bg-blue-800 transition"
            onClick={onSidebarOpen}
            aria-label="Open sidebar"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Kanban Board text: always visible, style changes with screen size */}
          <span className="block md:hidden text-base font-semibold">
            Kanban Board
          </span>
          <span className="hidden md:inline text-xl">Kanban Board</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ThemeToggle: icon only on mobile, normal on sm+ */}
          <span className="block sm:hidden">
            <ThemeToggle iconOnly />
          </span>
          <span className="hidden sm:block">
            <ThemeToggle />
          </span>
          {isAuthenticated && (
            <>
              {/* Logout icon button on mobile */}
              <button
                onClick={handleLogout}
                className="block sm:hidden p-2 rounded bg-white text-blue-600 hover:bg-blue-100 transition"
                aria-label="Logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                  />
                </svg>
              </button>
              {/* Logout text button on sm+ */}
              <button
                onClick={handleLogout}
                className="hidden sm:block bg-white text-blue-600 font-semibold px-3 sm:px-4 py-1 rounded hover:bg-blue-100 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
