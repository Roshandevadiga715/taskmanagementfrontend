import React, { useState, useRef, useEffect } from "react";
import TaskCard from "./TaskCard";
import { Draggable } from "@hello-pangea/dnd";
import { useKanbanStore } from "../../store/kanbanStore";

const Column = ({ title, columnId, onCardClick }) => {
  const tasks = useKanbanStore((s) => s.tasks[columnId] || []);
  const editTaskTitle = useKanbanStore((s) => s.editTaskTitle);
  const addTask = useKanbanStore((s) => s.addTask);

  // Inline input state
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  const handleCreate = () => {
    if (newTitle.trim()) {
      addTask(columnId, { title: newTitle.trim() });
      setNewTitle("");
      setCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setCreating(false);
      setNewTitle("");
    }
  };

  const handleBlur = () => {
    // Only close if input is empty
    if (!newTitle.trim()) {
      setCreating(false);
      setNewTitle("");
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded h-full p-2 sm:p-4 min-w-[200px] sm:min-w-[250px] text-gray-900 dark:text-gray-100 transition border border-gray-200 dark:border-gray-700 flex-1 max-w-full">
      <div className="flex items-center mb-4">
        <span className="font-extrabold text-lg sm:text-xl tracking-wide text-blue-700 dark:text-blue-300">
          {title}
        </span>
        {/* Optionally add icon here */}
      </div>
      <div className="h-1 w-full mb-2 rounded bg-blue-700 dark:bg-blue-400" />
      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <Draggable draggableId={task.id} index={idx} key={task.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <TaskCard
                  id={task.id}
                  title={task.title}
                  priority={task.priority}
                  estimate={task.estimate}
                  assignee={task.assignee}
                  dueDate={task.dueDate}
                  onClick={() => onCardClick && onCardClick(task)}
                  onTitleEdit={(newTitle) =>
                    editTaskTitle(task.id, columnId, newTitle)
                  }
                />
              </div>
            )}
          </Draggable>
        ))}
        {/* Inline create input */}
        {creating ? (
          <input
            ref={inputRef}
            className="w-full px-3 py-2 border border-blue-400 rounded outline-none focus:ring focus:ring-blue-200 bg-white dark:bg-gray-900 mt-4"
            placeholder="Enter task name and press Enter"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={40}
          />
        ) : (
          <div
            className="flex items-center justify-center mt-4 cursor-pointer text-gray-500 hover:text-blue-700 font-medium py-2 rounded transition"
            onClick={() => setCreating(true)}
          >
            <span className="text-xl mr-1">+</span> Create
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;
