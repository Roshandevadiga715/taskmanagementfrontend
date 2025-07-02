import React, { useState, useRef, useEffect } from "react";
import TaskCard from "./TaskCard";
import { Draggable } from "@hello-pangea/dnd";
import { useKanbanStore } from "../../store/kanbanStore";
// import { createTask } from "../../api/task.js"; // <-- import the API
import { createTask } from "../../api/task.js"; // <-- import the API

const Column = ({ title, columnId, onCardClick }) => {
  const tasks = useKanbanStore((s) => s.tasks[columnId] || []);
  const editTaskTitle = useKanbanStore((s) => s.editTaskTitle);
  const addTask = useKanbanStore((s) => s.addTask);

  // Inline input state
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDeadline, setNewDeadline] = useState("");
  const [newEstimate, setNewEstimate] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    // Compose the payload as per backend model
    const payload = {
      title: newTitle.trim(),
      description: newDescription,
      status: title, // Use column title as status
      deadline: newDeadline ? new Date(newDeadline) : undefined,
      priority: newPriority,
      estimate: newEstimate,
      // user: will be set by backend
      comments: [],
      attachments: [],
      tags: [],
      subtask: [],
    };
    try {
      const res = await createTask(payload); // <-- use the imported API
      if (res) {
        // Add to local store (assume addTask expects (columnId, taskObj))
        addTask(columnId, res);
      }
      setNewTitle("");
      setNewDescription("");
      setNewPriority("Medium");
      setNewDeadline("");
      setNewEstimate("");
      setCreating(false);
    } catch (err) {
      // Optionally show error
      alert("Failed to create task");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setCreating(false);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("Medium");
      setNewDeadline("");
      setNewEstimate("");
    }
  };

  const handleBlur = () => {
    // Only close if input is empty
    if (!newTitle.trim()) {
      setCreating(false);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("Medium");
      setNewDeadline("");
      setNewEstimate("");
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
          <div className="bg-white dark:bg-gray-900 rounded p-2 mt-4 border border-blue-400 flex flex-col gap-2">
            <input
              ref={inputRef}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded outline-none focus:ring focus:ring-blue-200 bg-white dark:bg-gray-900"
              placeholder="Enter task name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              maxLength={40}
              autoFocus
            />
            <textarea
              className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded outline-none bg-white dark:bg-gray-900 text-sm"
              placeholder="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <select
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <input
                type="date"
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
              <input
                type="time"
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm"
                value={newEstimate}
                onChange={(e) => setNewEstimate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white font-semibold"
                onClick={handleCreate}
                type="button"
              >
                Create
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                onClick={() => setCreating(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
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
