import React, { useState, useRef, useEffect } from "react";
import TaskCard from "./TaskCard";
import { Draggable } from "@hello-pangea/dnd";
import { useKanbanStore } from "../../store/kanbanStore";

const Column = ({ title, columnId, onCardClick }) => {
  const tasks = useKanbanStore((s) => s.tasks[columnId] || []);
  const editTaskTitle = useKanbanStore((s) => s.editTaskTitle);
  const createTask = useKanbanStore((s) => s.createTask);

  // Inline input state
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDeadline, setNewDeadline] = useState("");
  const [newEstimate, setNewEstimate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    console.log("tasks:", tasks);
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewPriority("Medium");
    setNewDeadline("");
    setNewEstimate("");
    setCreating(false);
    setIsSubmitting(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Compose the payload as per backend model
    const payload = {
      title: newTitle.trim(),
      description: newDescription,
      status: title, // Use column title as status
      deadline: newDeadline ? new Date(newDeadline) : undefined,
      priority: newPriority,
      estimate: newEstimate,
      comments: [],
      attachments: [],
      tags: [],
      subtask: [],
      // Add taskType and taskDataId if needed
      // Example: taskType: "task" or "subtask", taskDataId: "parentTaskId"
    };

    // If you are creating a subtask, set these:
    // payload.taskType = "subtask";
    // payload.taskDataId = "parentTaskId";

    try {
      // Use optimistic createTask from store
      await createTask(payload, columnId);
      resetForm();
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Failed to create task");
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      resetForm();
    }
  };

  const handleBlur = () => {
    // Only close if input is empty and not submitting
    if (!newTitle.trim() && !isSubmitting) {
      resetForm();
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded h-full p-2 sm:p-4 min-w-[200px] sm:min-w-[250px] text-gray-900 dark:text-gray-100 transition border border-gray-200 dark:border-gray-700 flex-1 max-w-full">
      <div className="flex items-center mb-4">
        <span className="font-extrabold text-lg sm:text-xl tracking-wide text-blue-700 dark:text-blue-300">
          {title}
        </span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          ({tasks.length})
        </span>
      </div>
      <div className="h-1 w-full mb-2 rounded bg-blue-700 dark:bg-blue-400" />
      <div className="space-y-2">
        {tasks.length === 0 && !creating && (
          <div className="text-center text-gray-400 dark:text-gray-500 py-4 select-none">
            No tasks
          </div>
        )}
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
                  assignee={task.user?.name}
                  createdAt={task.createdAt}
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
          <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded border border-blue-400 shadow-sm">
            <input
              ref={inputRef}
              className="w-full px-2 py-1 border-none outline-none bg-transparent text-sm font-medium placeholder-gray-400"
              placeholder="Enter task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              maxLength={100}
              disabled={isSubmitting}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || isSubmitting}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? "Creating..." : "Add"}
              </button>
              <button
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center mt-4 cursor-pointer text-gray-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium py-2 rounded transition hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setCreating(true)}
          >
            <span className="text-xl mr-1">+</span> Add Task
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;