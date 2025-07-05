import React, { useState } from 'react'
import TaskHistory from '../components/TaskHistory'
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

function TaskHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition">
      <Header onSidebarOpen={() => setSidebarOpen(true)} />
      <div className="flex-1 w-full flex justify-center">
        <div className="flex w-full  mx-auto overflow-hidden">
          {/* Sidebar: hidden on mobile, visible on md+ */}
          <div className="hidden md:block flex-shrink-0 w-52">
            <Sidebar />
          </div>
          {/* Sidebar Drawer for mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-30"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="relative w-52 max-w-full h-full bg-white dark:bg-gray-800 shadow-lg z-50">
                <Sidebar />
                <button
                  className="absolute top-2 right-2 p-2 rounded bg-gray-200 dark:bg-gray-700"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 6l8 8M6 14L14 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {/* Main content */}
          <main className="flex-1 min-w-0">
            <TaskHistory />
          </main>
        </div>
      </div>
    </div>
  );
}

export default TaskHistoryPage
