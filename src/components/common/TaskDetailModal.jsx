import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { getTaskById as apiGetTaskById } from "../../api/taskRequest";
import Modal from "../common/Modal";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaPlus,
  FaPaperclip as FaAttach,
  FaTasks,
  FaPaperclip,
} from "react-icons/fa";
import {
  useKanbanStore,
  modalStatusOptions,
  statusToColumn,
  columnToStatus,
  priorities,
} from "../../store/kanbanStore";
import ReactMarkdown from "react-markdown";
import { Select, Dropdown } from "antd";
import styles from "./TaskDetailModal.module.css";

// Priority badge color mapping for UI
const priorityColors = {
  High: "bg-red-100 text-red-600 border border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low: "bg-cyan-100 text-cyan-700 border border-cyan-200",
};

const TaskDetailModal = ({ isOpen, onClose, task, mode, taskId, taskType }) => {
  // --- GLOBAL STATE & ACTIONS ---
  // Get tasks and actions from Zustand store (global state manager)
  const tasks = useKanbanStore((s) => s.tasks);
  // REMOVE Zustand getTaskById, use API instead
  const moveTask = useKanbanStore((s) => s.moveTask);
  const editTaskTitle = useKanbanStore((s) => s.editTaskTitle);
  const setTaskPriority = useKanbanStore((s) => s.setTaskPriority);
  const setTaskEstimate = useKanbanStore((s) => s.setTaskEstimate);
  const setTaskDescription = useKanbanStore((s) => s.setTaskDescription);
  const setTaskAttachments = useKanbanStore((s) => s.setTaskAttachments);
  const setTaskSubtasks = useKanbanStore((s) => s.setTaskSubtasks);
  const createTask = useKanbanStore((s) => s.createTask);

  // --- COMMENT STATE FROM STORE ---
  const comments = useKanbanStore((s) => s.comments);
  const addComment = useKanbanStore((s) => s.addComment);
  const editComment = useKanbanStore((s) => s.editComment);
  const deleteComment = useKanbanStore((s) => s.deleteComment);

  // --- FIND COLUMN FOR TASK ---
  // Helper to find which column a task belongs to by searching all columns
  const findColumnId = (taskId) => {
    for (const colId in tasks) {
      if (tasks[colId].some((t) => t.id === taskId)) return colId;
    }
    return null;
  };


  // --- LOCAL TASK STATE (API) ---
  const [localTask, setLocalTask] = useState(task || null);
  // Find the columnId for this task
  const columnId = localTask?._id ? findColumnId(localTask?._id) : null;

  console.log(localTask, "localTask in TaskDetailModal");
  // --- LOCAL STATE ---
  // UI state for timer, dropdowns, and subtask input
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const intervalRef = useRef(null);

  // --- ACTIVITY LOG (STATIC) ---
  const history = useMemo(
    () => [
      {
        text: "changed the Status",
        user: "roshan devadiga",
        time: "20 hours ago",
        from: "USER TESTING",
        to: "IN DESIGN",
      },
      {
        text: "changed the Status",
        user: "roshan devadiga",
        time: "20 hours ago",
        from: "IN DESIGN",
        to: "USER TESTING",
      },
      {
        text: "changed the Status",
        user: "roshan devadiga",
        time: "20 hours ago",
        from: "TO DO",
        to: "IN DESIGN",
      },
      // ...add more mock history as needed
    ],
    []
  );
  const worklog = useMemo(
    () => [
      { text: "Logged 2h work", user: "roshan devadiga", time: "1 hour ago" },
      { text: "Logged 1h work", user: "roshan devadiga", time: "2 hours ago" },
      { text: "Logged 30m work", user: "roshan devadiga", time: "3 hours ago" },
      // ...add more mock worklog as needed
    ],
    []
  );

  // --- Activity Tabs State ---
  const [activityTab, setActivityTab] = useState("Comments");


  // --- REFRESH TASK FUNCTION ---
  const refreshTask = useCallback(async () => {
    const id = taskId || localTask?._id || task?.id;
    const type = taskType || "task";
    if (id) {
      try {
        const data = await apiGetTaskById(id, type);
        setLocalTask({ ...data, id: data.taskdataId || data.id });
      } catch (err) {
        setLocalTask(null);
      }
    }
  }, [taskId, taskType, localTask?._id, task?.id]);

  // --- EFFECTS ---
  // Fetch task by id from API when modal opens or task.id changes
  useEffect(() => {
    const fetchTask = async () => {
      if (isOpen && (taskId || task?.id)) {
        try {
          const id = taskId || task?.id;
          const type = taskType || "task";
          const data = await apiGetTaskById(id, type);
          setLocalTask({ ...data, id: data.taskdataId || data.id });
          console.log(data)
        } catch (err) {
          setLocalTask(null);
        }
      } else if (isOpen) {
        setLocalTask(task || null);
      }
      setNewSubtask("");
      stopTimer();
    };
    fetchTask();
    // eslint-disable-next-line
  }, [isOpen, taskId, taskType, task?.id ]);

  // --- TIMER LOGIC ---
  // Functions to start, pause, and stop the timer
  const startTimer = () => {
    if (!running) {
      setRunning(true);
      setPaused(false);
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
  };
  const pauseTimer = () => {
    setRunning(false);
    setPaused(true);
    clearInterval(intervalRef.current);
  };
  const stopTimer = () => {
    setRunning(false);
    setPaused(false);
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
  // Update description and refresh
  const handleDescriptionChange = (e) => {
    if (localTask?._id && columnId) {
      setTaskDescription(localTask._id, columnId, e.target.value);
      setTimeout(refreshTask, 0);
    }
  };
  // Update priority and refresh
  const handlePriorityChange = (p) => {
    if (localTask?._id && columnId) {
      setTaskPriority(localTask._id, columnId, p);
      setTimeout(refreshTask, 0);
    }
  };
  // Update estimate and refresh
  const handleEstimateChange = (e) => {
    if (localTask?._id && columnId) {
      setTaskEstimate(localTask._id, columnId, e.target.value);
      setTimeout(refreshTask, 0);
    }
  };
  // Update attachments and refresh
  const handleAttachment = (e) => {
    if (!localTask?._id || !columnId) return;
    const files = Array.from(e.target.files);
    const prev = localTask.attachments || [];
    // Add preview for images
    const filesWithPreview = files.map((file) => {
      if (file.type && file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        return Object.assign(file, { preview });
      }
      return file;
    });
    setTaskAttachments(localTask._id, columnId, [...prev, ...filesWithPreview]);
    setTimeout(refreshTask, 0);
  };
  // Update subtasks and refresh
  const handleSubtaskToggle = (idx) => {
    const updated = [...(localTask.subtasks || [])];
    updated[idx] = { ...updated[idx], done: !updated[idx].done };
    setTaskSubtasks(localTask._id, columnId, updated);
    setTimeout(refreshTask, 0);
  };
  // Add a new subtask and refresh
  const handleAddSubtask = async () => {
    if (!localTask?._id || !columnId) return;
    if (newSubtask.trim()) {
      try {
        // Compose subtask payload
        const payload = {
          title: newSubtask.trim(),
          description: "",
          status: localTask.status || columnId,
          priority: "Medium",
          estimate: "",
          comments: [],
          attachments: [],
          tags: [],
          subtask: [],
          taskType: "subtask",
          taskdataId: localTask?._id || localTask?._id,
        };
        // Create subtask via API/store
        await createTask(payload, columnId);
        setNewSubtask("");
        await refreshTask();
      } catch (err) {
        alert("Failed to create subtask");
      }
    }
  };
  // Handle dropdown actions (add attachment/subtask)
  const handleDropdown = (action) => {
    setShowAddDropdown(false);
    if (action === "attachment") {
      document.getElementById("attachment-input").click();
    }
    if (action === "subtask") {
      setShowSubtaskInput(true);
    }
  };

  // --- STATUS DROPDOWN LOGIC ---
  // Find the current status for the dropdown
  const currentStatus = useMemo(
    () =>
      modalStatusOptions.find((s) => s.value === columnId) ||
      modalStatusOptions[0],
    [columnId]
  );
  // Move task to a new column when status changes
  const handleStatusChange = (newStatus) => {
    if (localTask?._id && columnId && newStatus !== columnId) {
      moveTask(localTask._id, columnId, statusToColumn[newStatus], -1);
      setTimeout(refreshTask, 0);
    }
    setStatusDropdown(false);
  };

  // --- COMMENT SYSTEM ---
  const taskComments = localTask?._id ? comments[localTask?._id] || [] : [];

  // Add comment to task
  const handleAddComment = () => {
    if (localTask?._id && commentInput.trim()) {
      addComment(localTask?._id, commentInput.trim(), "Roshan");
      setCommentInput("");
      setTimeout(refreshTask, 0);
    }
  };
  // Edit comment
  const handleEditComment = (commentId, text) => {
    setEditingCommentId(commentId);
    setEditingCommentText(text);
  };
  // Save edited comment
  const handleSaveEditComment = (commentId) => {
    if (localTask?._id && editingCommentText.trim()) {
      editComment(localTask?._id, commentId, editingCommentText.trim());
      setEditingCommentId(null);
      setEditingCommentText("");
      setTimeout(refreshTask, 0);
    }
  };
  // Delete comment
  const handleDeleteComment = (commentId) => {
    if (localTask?._id) {
      deleteComment(localTask?._id, commentId);
      setTimeout(refreshTask, 0);
    }
  };

  // --- RENDER MODAL UI ---
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div
        className="relative p-6 min-w-0 w-full max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px] mx-auto flex flex-col md:flex-row gap-8 dark:border-gray-700 text-gray-900 dark:text-gray-100"
        style={{
          maxHeight: "565px",
          minHeight: "400px",
          minWidth: "0",
          height: "565px",
          boxSizing: "border-box",
          overflow: "visible",
          position: "relative",
        }}
      >
        {/* Spacer for close button */}
        <div style={{ height: 44, minHeight: 44, width: "100%", position: "absolute", top: 0, left: 0, zIndex: 1, pointerEvents: "none" }} />
        {/* ...existing code for modal content... */}
        <div
          className="flex-1 min-w-0"
          style={{
            maxHeight: "100%",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            paddingTop: 44,
          }}
        >
          {/* Modal Title */}
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-2xl text-gray-900 dark:text-gray-100">
              {localTask?.title ||
                (mode === "update" ? "Update Task" : "Create New Task")}
            </div>
            {/* Status Dropdown - AntD with custom option rendering for exact design */}
            <div className={styles.antdDropdownFix} style={{ width: 144 }}>
              <Select
                value={currentStatus.value}
                style={{
                  width: 144,
                  height: 32,
                  fontSize: 12,
                  borderRadius: 6,
                }}
                onChange={handleStatusChange}
                dropdownClassName={styles.antdDropdownFix}
                options={modalStatusOptions.map((opt) => ({
                  value: opt.value,
                  label: (
                    <span
                      className={`px-2 py-1 rounded font-semibold text-xs flex items-center gap-1`}
                      style={{
                        display: "inline-flex",
                        width: "100%",
                        color: opt.color?.includes("red")
                          ? "#dc2626"
                          : opt.color?.includes("yellow")
                          ? "#ca8a04"
                          : opt.color?.includes("cyan")
                          ? "#0e7490"
                          : opt.color?.includes("blue")
                          ? "#2563eb"
                          : opt.color?.includes("green")
                          ? "#059669"
                          : opt.color?.includes("gray")
                          ? "#6b7280"
                          : undefined,
                      }}
                    >
                      {opt.label}
                    </span>
                  ),
                }))}
                getPopupContainer={(trigger) => trigger.parentNode}
                size="middle"
                bordered={true}
              />
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            {/* Add Button with Dropdown */}
            <div className="flex items-center gap-2">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "attachment",
                      label: (
                        <span
                          className="flex items-center gap-2"
                          onClick={() => handleDropdown("attachment")}
                        >
                          {" "}
                          <FaAttach /> Attachment{" "}
                        </span>
                      ),
                    },
                    {
                      key: "subtask",
                      label: (
                        <span
                          className="flex items-center gap-2"
                          onClick={() => handleDropdown("subtask")}
                        >
                          {" "}
                          <FaTasks /> Subtask{" "}
                        </span>
                      ),
                    },
                  ],
                }}
                trigger={["click"]}
                placement="bottomLeft"
                overlayClassName={styles.antdDropdownFix}
              >
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white flex items-center gap-2 text-sm font-medium shadow"
                  type="button"
                >
                  <FaPlus /> Add{" "}
                  <svg
                    className="ml-1 w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </Dropdown>
              {/* Hidden file input for attachment */}
              <input
                id="attachment-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachment}
              />
            </div>
            {/* Remove Status Dropdown from here */}
          </div>
          {/* Description */}
          <div className="mb-6">
            <div className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
              Description
            </div>
            <div className="relative">
              <textarea
                className="w-full px-0 py-1 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-[16px] font-normal"
                placeholder="Add a description..."
                rows={1}
                value={localTask?.description || ""}
                onChange={handleDescriptionChange}
                style={{
                  minHeight: "28px",
                  maxHeight: "120px",
                  overflow: "auto",
                }}
              />
            </div>
            {/* Description below line */}
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
            {/* Attachments section below description */}
            {localTask?.attachments?.length > 0 && (
              <div className="mb-3">
                {/* Delete all and individual delete options */}
                <div className="flex items-center mb-2 justify-between">
                  <div className="flex items-center">
                    <span className="block font-semibold text-gray-700 dark:text-gray-300 mr-2">
                      Attachments
                    </span>
                    <span className="inline-block text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded px-2 py-0.5 font-semibold">
                      {localTask.attachments.length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-black text-white hover:bg-gray-800 font-semibold transition"
                      onClick={() => {
                        if (localTask?._id && columnId)
                          setTaskAttachments(localTask?._id, columnId, []);
                      }}
                      type="button"
                    >
                      Delete All
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {localTask.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="w-56 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden relative"
                    >
                      {/* Delete single attachment button */}
                      <button
                        className="absolute top-1 right-1 z-10 bg-black text-white hover:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-xs transition"
                        title="Delete"
                        onClick={() => {
                          if (localTask?._id && columnId) {
                            const newAttachments = [...localTask.attachments];
                            newAttachments.splice(idx, 1);
                            setTaskAttachments(
                              localTask?._id,
                              columnId,
                              newAttachments
                            );
                          }
                        }}
                        type="button"
                      >
                        &times;
                      </button>
                      {/* Preview image if available */}
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name || file}
                          className="w-full h-28 object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-full h-28 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs">
                          <FaPaperclip className="text-2xl" />
                        </div>
                      )}
                      <div className="p-2">
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                          {file.name ||
                            (typeof file === "string" ? file : "Attachment")}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {file.lastModified
                            ? new Date(file.lastModified).toLocaleString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "Just now"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtasks Section */}
          <div className="mb-6">
            {Array.isArray(localTask?.subtasks) && localTask.subtasks.length > 0 && (
              <>
                <div className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-100 flex justify-between mx-2 items-center gap-2">
                  Subtasks
                  <button
                    className="ml-2 px-2 py-1 rounded dark:border-white dark:text-white text-black border border-black text-xs font-medium flex items-center gap-1"
                    onClick={() => setShowSubtaskInput(true)}
                    type="button"
                  >
                    <FaPlus /> Add
                  </button>
                </div>
                {/* Subtasks Table */}
                <div className="overflow-x-auto mb-2 px-2">
                  <table className="min-w-[400px] w-full border border-gray-200 dark:border-gray-700 rounded text-xs">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold">Task ID</th>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold">Title</th>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold">Status</th>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localTask.subtasks.map((sub) => (
                        <tr key={sub._id || sub.id}>
                          <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">{sub.taskId}</td>
                          <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">{sub.title}</td>
                          <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="inline-block px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs">
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                            <span className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${
                              sub.priority === "High"
                                ? "bg-red-100 text-red-600 border border-red-200"
                                : sub.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : sub.priority === "Low"
                                ? "bg-cyan-100 text-cyan-700 border border-cyan-200"
                                : ""
                            }`}>
                              {sub.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {/* Add Subtask Input */}
            {showSubtaskInput && (
              <div className="flex gap-2 mb-2 mt-2 mx-2">
                <input
                  type="text"
                  className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddSubtask();
                    }
                  }}
                  autoFocus
                />
                <button
                  className="px-3 py-1 rounded dark:border-white dark:text-white text-black border border-black text-sm font-medium"
                  onClick={handleAddSubtask}
                >
                  Add
                </button>
                <button
                  className="px-3 py-1 rounded  dark:text-white text-black text-sm font-medium"
                  onClick={() => {
                    setShowSubtaskInput(false);
                    setNewSubtask("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Work log timer - styled as per screenshot */}
          <div className="mb-6 flex justify-start">
            <div className="w-full max-w-xs">
              <span className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100 ">
                Work log
              </span>
              <div className="flex items-center gap-3">
                {/* Initial: Only Start */}
                {!running && !paused && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 font-medium border border-gray-300 dark:border-gray-700"
                    onClick={startTimer}
                  >
                    <FaPlay className="text-base" />
                    Start work time
                  </button>
                )}
                {/* Running: Gray pause+timer, Red stop */}
                {running && (
                  <>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 font-medium border border-gray-300 dark:border-gray-700"
                      onClick={pauseTimer}
                    >
                      <FaPause className="text-base" />
                      <span className="font-mono">{formatTime(timer)}</span>
                    </button>
                    <button
                      className="flex items-center justify-center px-4 py-2 h-[44px] rounded bg-red-600 hover:bg-red-700 text-white font-medium"
                      style={{ minWidth: "44px" }}
                      onClick={stopTimer}
                    >
                      <FaStop className="text-base" />
                    </button>
                  </>
                )}
                {/* Paused: Gray play+timer, Red stop */}
                {!running && paused && (
                  <>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 font-medium border border-gray-300 dark:border-gray-700"
                      onClick={startTimer}
                    >
                      <FaPlay className="text-base" />
                      <span className="font-mono">{formatTime(timer)}</span>
                    </button>
                    <button
                      className="flex items-center justify-center px-4 py-2 h-[44px] rounded bg-red-600 hover:bg-red-700 text-white font-medium"
                      style={{ minWidth: "44px" }}
                      onClick={stopTimer}
                    >
                      <FaStop className="text-base" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="mb-2">
            <div className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
              Activity
            </div>
            <div className="flex gap-2 mb-2">
              {["Comments", "History", "Work log"].map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-1 rounded text-base ${
                    activityTab === tab
                      ? "bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-white font-semibold"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                  onClick={() => setActivityTab(tab)}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div
              className="bg-gray-100 dark:bg-gray-800 rounded p-2 max-h-32 overflow-y-auto text-xs text-gray-700 dark:text-gray-300"
              style={{ minHeight: "128px" }}
            >
              {activityTab === "Comments" && (
                <div style={{ minHeight: "100%" }}>
                  {/* Add comment input */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-white font-bold">
                      RD
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                        placeholder="Add a comment... (supports markdown, use @ to tag)"
                        rows={2}
                        style={{ resize: "none" }}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs"
                          onClick={handleAddComment}
                        >
                          Add
                        </button>
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 mt-1 text-[10px]">
                        Supports <span className="font-mono">Markdown</span> and{" "}
                        <span className="font-mono">@user</span> tagging.
                      </div>
                    </div>
                  </div>
                  {/* List comments */}
                  {taskComments.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      No comments yet.
                    </div>
                  )}
                  {taskComments.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-2 mb-2 group"
                    >
                      <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-white font-bold">
                        {typeof c.user === "string" && c.user.trim()
                          ? c.user
                              .split(" ")
                              .map((w) => (w && w[0] ? w[0] : ""))
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "?"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {c.user}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                            {new Date(c.timestamp).toLocaleString()}
                          </span>
                          {c.edited && (
                            <span className="text-xs text-gray-400 ml-1">
                              (edited)
                            </span>
                          )}
                        </div>
                        {editingCommentId === c.id ? (
                          <div className="flex gap-2 mt-1">
                            <textarea
                              className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                              rows={2}
                              style={{ resize: "none" }}
                              value={editingCommentText}
                              onChange={(e) =>
                                setEditingCommentText(e.target.value)
                              }
                            />
                            <button
                              className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs"
                              onClick={() => handleSaveEditComment(c.id)}
                            >
                              Save
                            </button>
                            <button
                              className="px-2 py-0.5 rounded bg-gray-300 text-gray-700 text-xs"
                              onClick={() => setEditingCommentId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert mt-1">
                            <ReactMarkdown>{c.text}</ReactMarkdown>
                          </div>
                        )}
                        <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            className="text-xs text-blue-600"
                            onClick={() => handleEditComment(c.id, c.text)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs text-red-600"
                            onClick={() => handleDeleteComment(c.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activityTab === "History" && (
                <div style={{ minHeight: "100%" }}>
                  {history.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      No history yet.
                    </div>
                  ) : (
                    history.map((h, idx) => (
                      <div key={idx} className="mb-2 flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-white font-bold">
                          {h.user[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {h.user}
                          </span>{" "}
                          {h.text}
                          <div className="flex gap-2 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono">
                              {h.from}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">
                              →
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono">
                              {h.to}
                            </span>
                          </div>
                          <div className="text-gray-400 dark:text-gray-500">
                            {h.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {activityTab === "Work log" && (
                <div style={{ minHeight: "100%" }}>
                  {worklog.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      No work log yet.
                    </div>
                  ) : (
                    worklog.map((w, idx) => (
                      <div key={idx} className="mb-2 flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-white font-bold">
                          {w.user[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {w.user}
                          </span>{" "}
                          {w.text}
                          <div className="text-gray-400 dark:text-gray-500">
                            {w.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col">
          <div className="font-semibold text-base mb-3 text-gray-900 dark:text-gray-100">
            Details
          </div>
          {/* Assignee */}
          <div className="mb-3 flex items-center">
            <span className="w-24 text-gray-700 dark:text-gray-300">
              Assignee
            </span>
            <span className="flex-1 text-gray-900 dark:text-gray-100">
              roshan devadiga
            </span>
          </div>
          {/* Priority */}
          <div className="mb-3 flex items-center">
            <span className="w-24 text-gray-700 dark:text-gray-300">
              Priority
            </span>
            <div className={styles.antdDropdownFix} style={{ width: "100%" }}>
              <Select
                value={localTask?.priority || "High"}
                style={{
                  width: "100%",
                  height: 32,
                  fontSize: 14,
                  borderRadius: 6,
                }}
                onChange={handlePriorityChange}
                dropdownClassName={styles.antdDropdownFix}
                options={priorities.map((p) => ({
                  value: p,
                  label: (
                    <span
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold`}
                      style={{
                        color:
                          p === "High"
                            ? "#dc2626"
                            : p === "Medium"
                            ? "#ca8a04"
                            : p === "Low"
                            ? "#0e7490"
                            : undefined,
                        // No background color for selected or options
                        borderRadius: 4,
                        display: "inline-flex",
                        width: "100%",
                      }}
                    >
                      {p}
                    </span>
                  ),
                }))}
                getPopupContainer={(trigger) => trigger.parentNode}
                size="middle"
                bordered={true}
              />
            </div>
          </div>
          {/* Estimate */}
          <div className="mb-3 flex items-center">
            <span className="w-24 text-gray-700 dark:text-gray-300">
              Estimate
            </span>
            <input
              type="time"
              step="60"
              className="flex-1 px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="2h 30m"
              value={localTask?.estimate || ""}
              onChange={handleEstimateChange}
            />
          </div>
          {/* Subtasks Section */}
          {/* {localTask && (
            <div className="mb-6">
              <div className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
                Subtasks
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddSubtask();
                    }
                  }}
                />
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium"
                  onClick={handleAddSubtask}
                >
                  Add
                </button>
              </div>
              <ul className="space-y-1">
                {(localTask.subtasks || []).map((sub, idx) => (
                  <li key={sub.id || idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!sub.done}
                      onChange={() => {
                        // Toggle done state for subtask
                        const updated = [...(localTask.subtasks || [])];
                        updated[idx] = { ...sub, done: !sub.done };
                        setTaskSubtasks(localTask?._id, columnId, updated);
                      }}
                    />
                    <span className={sub.done ? "line-through text-gray-400" : ""}>
                      {sub.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )} */}
          {/* ...existing code for more details fields if needed... */}
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;

