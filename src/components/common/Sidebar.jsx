import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="h-full w-52 max-w-xs bg-gray-100 dark:bg-gray-800 p-4 shadow text-gray-900 dark:text-gray-100 transition overflow-y-auto">
      <nav className="flex flex-col gap-2">
        <Link
          to="/"
          className={`px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${
            location.pathname === "/"
              ? "bg-gray-200 dark:bg-gray-700 font-semibold"
              : ""
          }`}
        >
          Kanban View
        </Link>
        <Link
          to="/taskhistory"
          className={`px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${
            location.pathname === "/taskhistory"
              ? "bg-gray-200 dark:bg-gray-700 font-semibold"
              : ""
          }`}
        >
          Task History
        </Link>
      </nav>
   
    </aside>
  );
};

export default Sidebar;
