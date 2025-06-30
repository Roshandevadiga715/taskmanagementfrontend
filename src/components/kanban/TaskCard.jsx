import React, { useState, useRef, useEffect } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import { useKanbanStore } from "../../store/kanbanStore";

// Priority badge colors
const priorityColors = {
  High: "bg-red-100 text-red-600 border border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low: "bg-cyan-100 text-cyan-700 border border-cyan-200",
};

const MAX_TITLE_LENGTH = 40; // or any value that fits your UI

const TaskCard = ({
  id,
  title,
  priority,
  estimate,
  onClick,
  assignee,
  dueDate,
  onTitleEdit, // callback for title edit
  showEdit = true,
  status,
}) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title || "Untitled");
  const inputRef = useRef(null);

  const user = assignee || "Roshan";
  const date = dueDate || "30-06-2024";
  const avatar = user ? user[0].toUpperCase() : "?";
  const statusOptions = useKanbanStore((s) => s.statusOptions);
  const updateTaskStatus = useKanbanStore((s) => s.updateTaskStatus);

  // Keep editTitle in sync with prop
  useEffect(() => {
    setEditTitle(title || "Untitled");
  }, [title]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditTitle(title || "Untitled");
    setEditing(true);
  };

  const handleEditDone = () => {
    setEditing(false);
    if (onTitleEdit && editTitle.trim() && editTitle !== title) {
      onTitleEdit(editTitle.trim().slice(0, MAX_TITLE_LENGTH));
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") {
      handleEditDone();
    }
    if (e.key === "Escape") {
      setEditing(false);
      setEditTitle(title || "Untitled");
    }
  };

  return (
    <div
      className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded shadow-md px-4 py-4 flex flex-col gap-2 min-w-[220px] max-w-xs cursor-pointer transition hover:shadow-lg"
      onClick={onClick}
    >
      {/* Priority badge */}
      <span
        className={`absolute top-3 left-4 px-2 py-0.5 rounded text-xs font-semibold ${priorityColors[priority] || "bg-gray-200 text-gray-600 border border-gray-300"}`}
        style={{ minWidth: 40, textAlign: "center" }}
      >
        {priority}
      </span>

      {/* Title with edit */}
      <div className="mt-6 font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
        {editing ? (
          <input
            ref={inputRef}
            className="bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none text-base font-bold w-full"
            value={editTitle}
            onChange={(e) => {
              if (e.target.value.length <= MAX_TITLE_LENGTH) {
                setEditTitle(e.target.value);
              }
            }}
            maxLength={MAX_TITLE_LENGTH}
            onBlur={handleEditDone}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleEditKeyDown}
          />
        ) : (
          <>
            <span
              className="truncate max-w-[150px] block"
              title={title || "Untitled"}
            >
              {(title || "Untitled").length > MAX_TITLE_LENGTH
                ? (title || "Untitled").slice(0, MAX_TITLE_LENGTH) + "…"
                : title || "Untitled"}
            </span>
            <span
              style={{ width: 24, display: "inline-flex", justifyContent: "center" }}
            >
              {showEdit ? (
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1"
                  onClick={handleEditClick}
                  tabIndex={-1}
                  type="button"
                >
                  <AiOutlineEdit size={18} />
                </button>
              ) : (
                // Empty space to maintain width
                <span style={{ display: "inline-block", width: 18, height: 18 }} />
              )}
            </span>
          </>
        )}
      </div>
      {/* Description hidden */}

      {/* Divider */}
      <hr className="border-t border-gray-200 dark:border-gray-700 my-0.5" />

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        {/* Avatar and name */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200">
            {avatar}
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300">
            {user}
          </span>
        </div>
        {/* Due date */}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="w-4 h-4 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {date}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
     
