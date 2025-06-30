import React, { useState } from "react";
import Board from "./kanban/Board";
import TaskDetailModal from "./common/TaskDetailModal";

function KanbanView() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Responsive header/actions area */}
      {/* 
      <div className="flex justify-end py-4 px-2 sm:px-4 md:px-8">
        <button
          className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 transition"
          onClick={() => setModalOpen(true)}
        >
          + New Task
        </button>
      </div>
      */}
      {/* Responsive board container */}
      <div className="flex-1 w-full mx-auto px-2 sm:px-0  py-2 sm:py-4 overflow-x-auto  dark:bg-gray-900">
        <Board />
      </div>
      {/* 
      <TaskDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        task={null}
        mode="create"
      />
      */}
    </div>
  );
}

export default KanbanView;
