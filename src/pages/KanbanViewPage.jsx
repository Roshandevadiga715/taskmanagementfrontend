import React from "react";
import KanbanView from "../components/KanbanView";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";

function KanbanViewPage() {
  return (
   <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition">
    <Header />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 transition">
        <KanbanView />
      </main>
    </div>
  </div>
  );
}

export default KanbanViewPage;
