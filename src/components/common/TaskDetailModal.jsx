import React, { useState, useRef, useEffect, useMemo } from "react";
import Modal from "../common/Modal";
import { FaPlay, FaPause, FaStop, FaPlus, FaChevronDown, FaPaperclip as FaAttach, FaTasks } from "react-icons/fa";
import { useKanbanStore, modalStatusOptions, statusToColumn, columnToStatus, priorities } from "../../store/kanbanStore";

// Priority badge color mapping for UI
const priorityColors = {
  High: "bg-red-100 text-red-600 border border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low: "bg-cyan-100 text-cyan-700 border border-cyan-200",
};

const TaskDetailModal = ({ isOpen, onClose, task, mode }) => {
  // --- GLOBAL STATE & ACTIONS ---
  // Get tasks and actions from Zustand store (global state manager)
  const tasks = useKanbanStore((s) => s.tasks);
  const getTaskById = useKanbanStore((s) => s.getTaskById);
  const moveTask = useKanbanStore((s) => s.moveTask);
  const editTaskTitle = useKanbanStore((s) => s.editTaskTitle);
  const setTaskPriority = useKanbanStore((s) => s.setTaskPriority);
  const setTaskEstimate = useKanbanStore((s) => s.setTaskEstimate);
  const setTaskDescription = useKanbanStore((s) => s.setTaskDescription);
  const setTaskAttachments = useKanbanStore((s) => s.setTaskAttachments);
  const setTaskSubtasks = useKanbanStore((s) => s.setTaskSubtasks);

  // --- FIND COLUMN FOR TASK ---
  // Helper to find which column a task belongs to by searching all columns
  const findColumnId = (taskId) => {
    for (const colId in tasks) {
      if (tasks[colId].some((t) => t.id === taskId)) return colId;
    }
    return null;
  };

  // --- GET LATEST TASK DATA ---
  // Always use the latest version of the task from the store
  const localTask = useMemo(
    () => (task?.id ? getTaskById(task.id) : task),
    [task, getTaskById, tasks]
  );
  // Find the columnId for this task
  const columnId = localTask?.id ? findColumnId(localTask.id) : null;

  // --- LOCAL STATE ---
  // UI state for timer, dropdowns, and subtask input
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const intervalRef = useRef(null);

  // --- ACTIVITY LOG (STATIC) ---
  // Example activity log for the task
  const activity = useMemo(() => [
    { text: "Task created", user: "roshan devadiga", time: "2m ago" },
    // ...add more mock activity as needed
  ], []);

  // --- EFFECTS ---
  // Reset timer and subtask input when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setNewSubtask("");
    stopTimer();
    // eslint-disable-next-line
  }, [localTask, isOpen]);

  // --- TIMER LOGIC ---
  // Functions to start, pause, and stop the timer
  const startTimer = () => {
    if (!running) {
      setRunning(true);
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
  };
  const pauseTimer = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
  };
  const stopTimer = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setTimer(0);
  };
  // Format timer as HH:MM:SS
  const formatTime = (t) => {
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = String(t % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // --- HANDLERS ---
  // Reset form and timer on close
  const handleClose = () => {
    setNewSubtask("");
    stopTimer();
    onClose();
  };
  // Handle file attachment upload
  const handleAttachment = (e) => {
    if (!localTask?.id || !columnId) return;
    const files = Array.from(e.target.files);
    const prev = localTask.attachments || [];
    setTaskAttachments(localTask.id, columnId, [...prev, ...files]);
  };
  // Add a new subtask to the task
  const handleAddSubtask = () => {
    if (!localTask?.id || !columnId) return;
    if (newSubtask.trim()) {
      const prev = localTask.subtasks || [];
      setTaskSubtasks(localTask.id, columnId, [...prev, { title: newSubtask, done: false }]);
      setNewSubtask("");
    }
  };
  // Handle dropdown actions (add attachment/subtask)
  const handleDropdown = (action) => {
    setShowAddDropdown(false);
    if (action === "attachment") {
      document.getElementById("attachment-input").click();
    }
    if (action === "subtask") {
      alert("Add subtask clicked");
    }
  };

  // --- STATUS DROPDOWN LOGIC ---
  // Find the current status for the dropdown
  const currentStatus = useMemo(
    () => modalStatusOptions.find((s) => s.value === columnId) || modalStatusOptions[0],
    [columnId]
  );
  // Move task to a new column when status changes
  const handleStatusChange = (newStatus) => {
    if (localTask?.id && columnId && newStatus !== columnId) {
      moveTask(localTask.id, columnId, statusToColumn[newStatus], -1);
    }
    setStatusDropdown(false);
  };

  // --- RENDER MODAL UI ---
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-5xl mx-auto bg-white dark:bg-gray-900 p-6 flex flex-col md:flex-row gap-8">
        {/* Left Column */}
        <div className="flex-1 min-w-0">
          {/* Modal Title */}
          <div className="font-semibold text-2xl mb-2 text-gray-900 dark:text-gray-100">
            {localTask?.title || (mode === "update" ? "Update Task" : "Create New Task")}
          </div>
          <div className="flex items-center justify-between mb-4">
            {/* Add Button with Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white flex items-center gap-2 text-sm font-medium shadow"
                  onClick={() => setShowAddDropdown((v) => !v)}
                  type="button"
                >
                  <FaPlus /> Add <FaChevronDown className="ml-1" />
                </button>
                {showAddDropdown && (
                  <div className="absolute z-10 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-900 dark:text-gray-100"
                      onClick={() => handleDropdown("attachment")}
                    >
                      <FaAttach /> Attachment
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-900 dark:text-gray-100"
                      onClick={() => handleDropdown("subtask")}
                    >
                      <FaTasks /> Subtask
                    </button>
                  </div>
                )}
                {/* Hidden file input for attachment */}
                <input
                  id="attachment-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachment}
                />
              </div>
            </div>
            {/* Status Dropdown */}
            <div className="relative">
              <button
                className={`px-2 py-1 rounded font-semibold text-xs flex items-center gap-1 ${currentStatus.color} border`}
                onClick={() => setStatusDropdown((v) => !v)}
                type="button"
              >
                {currentStatus.label}
                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {statusDropdown && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-20">
                  {modalStatusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold ${opt.color} hover:bg-gray-100 dark:hover:bg-gray-700`}
                      onClick={() => handleStatusChange(opt.value)}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Description */}
          <div className="mb-6">
            <div className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">Description</div>
            <textarea
              className="w-full px-3 py-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Add a description..."
              rows={4}
              value={localTask?.description || ""}
              onChange={(e) => localTask?.id && columnId && setTaskDescription(localTask.id, columnId, e.target.value)}
            />
          </div>
          {/* Activity */}
          <div className="mb-2">
            <div className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">Activity</div>
            <div className="flex gap-2 mb-2">
              {/* Removed "All" button */}
              <button className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                Comments
              </button>
              <button className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                History
              </button>
              <button className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                Work log
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 max-h-32 overflow-y-auto text-xs text-gray-700 dark:text-gray-300">
              {activity.map((a, idx) => (
                <div key={idx} className="mb-2 flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-white font-bold">
                    {a.user[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{a.user}</span>{" "}
                    {a.text}
                    <div className="text-gray-400 dark:text-gray-500">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="font-semibold text-base mb-3 text-gray-900 dark:text-gray-100">Details</div>
          {/* Assignee */}
          <div className="mb-3 flex items-center">
            <span className="w-24 text-gray-700 dark:text-gray-300">Assignee</span>
            <span className="flex-1 text-gray-900 dark:text-gray-100">roshan devadiga</span>
          </div>
          {/* Priority */}
          <div className="mb-3 flex items-center">
            <span className="w-24 text-gray-700 dark:text-gray-300">Priority</span>
            <div className="relative flex-1">
              <select
                className={`w-full px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 appearance-none`}
                value={localTask?.priority || "High"}
                onChange={(e) => localTask?.id && columnId && setTaskPriority(localTask.id, columnId, e.target.value)}
                style={{
                  color:
                    localTask?.priority === "High"
                      ? "#dc2626"
                      : localTask?.priority === "Medium"
                      ? "#ca8a04"
                      : localTask?.priority === "Low"
                      ? "#0e7490"
                      : undefined,
                  backgroundColor:
                    localTask?.priority === "High"
                      ? "#fee2e2"
                      : localTask?.priority === "Medium"
                      ? "#fef9c3"
                      : localTask?.priority === "Low"
                      ? "#cffafe"
                      : undefined,
                  borderColor:
                    localTask?.priority === "High"
                      ? "#fecaca"
                      : localTask?.priority === "Medium"
                      ? "#fef08a"
                      : localTask?.priority === "Low"
                      ? "#a5f3fc"
                      : undefined,
                }}
              >
                {priorities.map((p) => (
                  <option
                    key={p}
                    value={p}
                    style={{
                      color:
                        p === "High"
                          ? "#dc2626"
                          : p === "Medium"
                          ? "#ca8a04"
                          : p === "Low"
                          ? "#0e7490"
                          : undefined,
                      backgroundColor:
                        p === "High"
                          ? "#fee2e2"
                          : p === "Medium"
                          ? "#fef9c3"
                          : p === "Low"
                          ? "#cffafe"
                          : undefined,
                    }}
                  >
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Estimate */}
          <div className="mb-3 flex items-center">
            <span className="w-24 text-gray-700 dark:text-gray-300">Estimate</span>
            <input
              type="time"
              step="60"
              className="flex-1 px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="2h 30m"
              value={localTask?.estimate || ""}
              onChange={(e) => localTask?.id && columnId && setTaskEstimate(localTask.id, columnId, e.target.value)}
            />
          </div>
          {/* Attachments (show only if any) */}
          {(localTask?.attachments?.length > 0) && (
            <div className="mb-3">
              <span className="block text-gray-700 dark:text-gray-300 mb-1">Attachments</span>
              <div className="flex flex-wrap gap-2">
                {localTask.attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-900 dark:text-gray-100"
                  >
                    {file.name || file}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Timer */}
          <div className="mb-3">
            <span className="block text-gray-700 dark:text-gray-300 mb-1">Work log</span>
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 flex flex-col items-center">
              <span className="text-3xl font-mono text-green-400">
                {formatTime(timer)}
              </span>
              <div className="flex gap-3 mt-3">
                <button
                  className="px-4 py-2 rounded flex items-center gap-2 text-white text-sm font-medium bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:ring-2 focus:ring-blue-400 transition disabled:opacity-60 disabled:cursor-not-allowed shadow"
                  onClick={startTimer}
                  disabled={running}
                >
                  <FaPlay className="text-base" />
                  Start
                </button>
                <button
                  className="px-4 py-2 rounded flex items-center gap-2 text-white text-sm font-medium bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 focus:ring-2 focus:ring-yellow-400 transition disabled:opacity-60 disabled:cursor-not-allowed shadow"
                  onClick={pauseTimer}
                  disabled={!running}
                >
                  <FaPause className="text-base" />
                  Pause
                </button>
                <button
                  className="px-4 py-2 rounded flex items-center gap-2 text-white text-sm font-medium bg-red-700 hover:bg-red-800 active:bg-red-900 focus:ring-2 focus:ring-red-400 transition shadow"
                  onClick={stopTimer}
                >
                  <FaStop className="text-base" />
                  Stop
                </button>
              </div>
            </div>
          </div>
          {/* ...existing code for more details fields if needed... */}
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;



