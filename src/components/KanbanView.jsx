import React, { useState } from "react";
import Board from "./kanban/Board";
import TaskDetailModal from "./common/TaskDetailModal";

function KanbanView() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end  py-4 px-2">
        <button
          className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 transition"
          onClick={() => setModalOpen(true)}
        >
          + New Task
        </button>
      </div>
      <Board />
      <TaskDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        task={null}
        mode="create"
      />
    </div>
  );
}

export default KanbanView;
