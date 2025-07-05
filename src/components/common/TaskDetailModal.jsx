import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { getTaskById as apiGetTaskById, createTask as apiCreateTask } from "../../api/taskRequest";
import { Modal, Breadcrumb } from "antd";
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
import "../../styles/custom-ant-modal-dark.css";
import { Select, Dropdown, Table, Input, Form, DatePicker } from "antd";
import styles from "./TaskDetailModal.module.css";
import moment from "moment";

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
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const intervalRef = useRef(null);

  // --- ACTIVITY LOG (STATIC) ---
  // const history = useMemo(
  //   () => [
  //     {
  //       text: "changed the Status",
  //       user: "roshan devadiga",
  //       time: "20 hours ago",
  //       from: "USER TESTING",
  //       to: "IN DESIGN",
  //     },
  //     {
  //       text: "changed the Status",
  //       user: "roshan devadiga",
  //       time: "20 hours ago",
  //       from: "IN DESIGN",
  //       to: "USER TESTING",
  //     },
  //     {
  //       text: "changed the Status",
  //       user: "roshan devadiga",
  //       time: "20 hours ago",
  //       from: "TO DO",
  //       to: "IN DESIGN",
  //     },
  //     // ...add more mock history as needed
  //   ],
  //   []
  // );
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

  // --- Optimistic update helpers for task fields ---
  const optimisticUpdateTaskField = (field, value) => {
    setLocalTask((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // --- HANDLERS ---
  // Reset form and timer on close
  const handleClose = () => {
    setNewSubtask("");
    stopTimer();
    onClose();
  };

  // --- SUBTASK NAVIGATION STATE ---
  const [isSubTask, setIsSubTask] = useState(false);
  const [activeSubTask, setActiveSubTask] = useState(null);

  // --- LOCAL COMMENT STATE FOR SUBTASKS ---
  const [subtaskComments, setSubtaskComments] = useState([]);

  // --- DATA SOURCE: task or subtask ---
  const displayData = isSubTask && activeSubTask ? activeSubTask : localTask;

  // --- Reset subtask state on modal open/close or task change ---
  useEffect(() => {
    setIsSubTask(false);
    setActiveSubTask(null);
    setSubtaskComments([]);
  }, [isOpen, taskId, taskType, task?.id]);

  // --- Breadcrumb click handlers ---
  const handleBreadcrumbTask = () => {
    setIsSubTask(false);
    setActiveSubTask(null);
    setSubtaskComments([]);
  };

  // --- Subtask title click handler ---
  const handleSubtaskTitleClick = (subtask) => {
    setIsSubTask(true);
    setActiveSubTask(subtask);
    setSubtaskComments(subtask.comments || []);
  };

  // --- Update handlers: use displayData and update correct entity ---
  const handleDescriptionChange = (e) => {
    setDescriptionDraft(e.target.value);
  };

  const handleEditDescription = () => {
    setEditingDescription(true);
    setDescriptionDraft(displayData?.description || "");
  };

  const handleCancelEditDescription = () => {
    setEditingDescription(false);
    setDescriptionDraft(displayData?.description || "");
  };

  const handleSaveEditDescription = async () => {
    if (isSubTask && activeSubTask?._id && columnId) {
      const updated = { ...activeSubTask, description: descriptionDraft };
      setActiveSubTask(updated);
      setTaskSubtasks(activeSubTask._id, columnId, [updated]);
      await refreshTask();
      setEditingDescription(false);
    } else if (localTask?._id && columnId) {
      optimisticUpdateTaskField("description", descriptionDraft);
      await setTaskDescription(localTask._id, columnId, descriptionDraft);
      await refreshTask();
      setEditingDescription(false);
    }
  };

  const handlePriorityChange = (p) => {
    if (isSubTask && activeSubTask?._id && columnId) {
      const updated = { ...activeSubTask, priority: p };
      setActiveSubTask(updated);
      setTaskSubtasks(activeSubTask._id, columnId, [updated]);
      setTimeout(refreshTask, 300);
    } else if (localTask?._id && columnId) {
      optimisticUpdateTaskField("priority", p);
      setTaskPriority(localTask._id, columnId, p);
      setTimeout(refreshTask, 300);
    }
  };

  const handleEstimateChange = async (date, dateString) => {
    if (isSubTask && activeSubTask?._id && columnId) {
      const updated = { ...activeSubTask, estimate: dateString };
      setActiveSubTask(updated);
      setTaskSubtasks(activeSubTask._id, columnId, [updated]);
      await refreshTask();
    } else if (localTask?._id && columnId) {
      optimisticUpdateTaskField("estimate", dateString);
      await setTaskEstimate(localTask._id, columnId, dateString);
      await refreshTask();
    }
  };

  // --- Status change handler ---
  const handleStatusChange = (newStatus) => {
    if (isSubTask && activeSubTask?._id && columnId && newStatus !== activeSubTask.status) {
      const updated = { ...activeSubTask, status: newStatus };
      setActiveSubTask(updated);
      setTaskSubtasks(activeSubTask._id, columnId, [updated]);
      setTimeout(refreshTask, 300);
    } else if (localTask?._id && columnId && newStatus !== columnId) {
      optimisticUpdateTaskField("status", newStatus);
      moveTask(localTask._id, columnId, statusToColumn[newStatus], -1);
      setTimeout(refreshTask, 300);
    }
    setStatusDropdown(false);
  };

  // --- Comments logic: use subtaskComments for subtask, global store for task ---
  const taskComments = isSubTask
    ? subtaskComments
    : localTask?._id
    ? (comments[localTask._id] || [])
    : [];

  // --- Add comment handler (async for both task and subtask) ---
  const handleAddComment = async () => {
    if (isSubTask && activeSubTask && activeSubTask._id && columnId && commentInput.trim()) {
      // Prepare new comment (without _id)
      const newComment = {
        text: commentInput.trim(),
        user: "Roshan",
        timestamp: new Date().toISOString(),
      };
      // Optimistically update UI
      const updated = {
        ...activeSubTask,
        comments: [...(activeSubTask.comments || []), newComment],
      };
      setActiveSubTask(updated);
      setSubtaskComments(updated.comments);
      setTaskSubtasks(activeSubTask._id, columnId, [updated]);
      setCommentInput("");
      setTimeout(async () => {
        await refreshTask();
        // Fetch latest subtask from refreshed localTask
        const refreshedTask = await apiGetTaskById(localTask._id, "task");
        const refreshedSubtask = (refreshedTask.subtasks || []).find(
          (s) => s._id === activeSubTask._id || s.id === activeSubTask._id
        );
        if (refreshedSubtask) {
          setActiveSubTask(refreshedSubtask);
          setSubtaskComments(refreshedSubtask.comments || []);
        }
      }, 300);
    } else if (localTask?._id && commentInput.trim()) {
      setLocalTask((prev) => ({
        ...prev,
        comments: [
          ...(prev.comments || []),
          {
            text: commentInput.trim(),
            user: "Roshan",
            timestamp: new Date().toISOString(),
          },
        ],
      }));
      await addComment(localTask._id, commentInput.trim(), "Roshan");
      setCommentInput("");
      setTimeout(refreshTask, 300);
    }
  };

  const handleEditComment = (commentId, text) => {
    setEditingCommentId(commentId);
    setEditingCommentText(text);
  };

  const handleSaveEditComment = (commentId) => {
    if (isSubTask && activeSubTask) {
      if (editingCommentText.trim()) {
        const updatedComments = (activeSubTask.comments || []).map((c) =>
          c._id === commentId
            ? { ...c, text: editingCommentText.trim(), edited: true }
            : c
        );
        const updated = { ...activeSubTask, comments: updatedComments };
        setActiveSubTask(updated);
        setSubtaskComments(updatedComments);
        setTaskSubtasks(activeSubTask._id, columnId, [updated]);
        setEditingCommentId(null);
        setEditingCommentText("");
        setTimeout(refreshTask, 300);
      }
    } else if (localTask?._id && editingCommentText.trim()) {
      setLocalTask((prev) => ({
        ...prev,
        comments: (prev.comments || []).map((c) =>
          c._id === commentId
            ? { ...c, text: editingCommentText.trim(), edited: true }
            : c
        ),
      }));
      editComment(localTask._id, commentId, editingCommentText.trim());
      setEditingCommentId(null);
      setEditingCommentText("");
      setTimeout(refreshTask, 300);
    }
  };

  const handleDeleteComment = (commentId) => {
    if (isSubTask && activeSubTask) {
      const updatedComments = (activeSubTask.comments || []).filter((c) => c._id !== commentId);
      const updated = { ...activeSubTask, comments: updatedComments };
      setActiveSubTask(updated);
      setSubtaskComments(updatedComments);
      setTaskSubtasks(activeSubTask._id, columnId, [updated]);
      setTimeout(refreshTask, 300);
    } else if (localTask?._id) {
      setLocalTask((prev) => ({
        ...prev,
        comments: (prev.comments || []).filter((c) => c._id !== commentId),
      }));
      deleteComment(localTask._id, commentId);
      setTimeout(refreshTask, 300);
    }
  };

  // --- STATUS DROPDOWN LOGIC ---
  // Find the current status for the dropdown
  const currentStatus = useMemo(() => {
    if (isSubTask && activeSubTask) {
      return (
        modalStatusOptions.find((s) => s.value === activeSubTask.status) ||
        modalStatusOptions[0]
      );
    }
    return modalStatusOptions.find((s) => s.value === columnId) || modalStatusOptions[0];
  }, [isSubTask, activeSubTask, columnId]);

  // --- COMMENT SYSTEM ---
  // Use only _id for comment keys and edit/delete
  // const taskComments = localTask?._id ? (comments[localTask._id] || []) : [];

  // Editable Table State
  const [editingSubtaskKey, setEditingSubtaskKey] = useState("");
  const [form] = Form.useForm();

  // Editable Table helpers
  const isEditing = (record) => record._id === editingSubtaskKey || record.id === editingSubtaskKey;

  const edit = (record) => {
    form.setFieldsValue({
      title: "",
      status: "",
      priority: "",
      ...record,
    });
    setEditingSubtaskKey(record._id || record.id);
  };

  const cancel = () => {
    setEditingSubtaskKey("");
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...(localTask.subtasks || [])];
      const index = newData.findIndex((item) => (item._id || item.id) === key);
      if (index > -1) {
        // Only update the edited subtask
        const item = newData[index];
        const updatedSubtask = { ...item, ...row };
        // Optimistically update localTask.subtasks for instant UI feedback
        const updatedSubtasks = [...newData];
        updatedSubtasks[index] = updatedSubtask;
        setLocalTask((prev) => ({
          ...prev,
          subtasks: updatedSubtasks,
        }));
        // Call setTaskSubtasks with subtask id and array with only the updated subtask
        setTaskSubtasks(updatedSubtask._id || updatedSubtask.id, columnId, [updatedSubtask]);
        setEditingSubtaskKey("");
        // Delay refresh to allow optimistic UI to show instantly
        setTimeout(refreshTask, 300);
      }
    } catch (errInfo) {
      // Validation failed
    }
  };

  // AntD Table columns for editable subtasks
  const subtaskColumns = [
    {
      title: "Task ID",
      dataIndex: "taskId",
      key: "taskId",
      width: 100,
      render: (text) => <span>{text}</span>,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      editable: true,
      width: 180,
      render: (text, record) => {
        return isEditing(record) ? (
          <Form.Item
            name="title"
            style={{ margin: 0 }}
            rules={[{ required: true, message: "Title is required." }]}
          >
            <Input size="small" />
          </Form.Item>
        ) : (
          <span
            className="text-blue-600 underline cursor-pointer"
            onClick={() => handleSubtaskTitleClick(record)}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      editable: true,
      width: 120,
      render: (text, record) => {
        return isEditing(record) ? (
          <Form.Item
            name="status"
            style={{ margin: 0 }}
            rules={[{ required: true, message: "Status is required." }]}
          >
            <Select
              size="small"
              options={modalStatusOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </Form.Item>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs">
            {text}
          </span>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      editable: true,
      width: 120,
      render: (text, record) => {
        return isEditing(record) ? (
          <Form.Item
            name="priority"
            style={{ margin: 0 }}
            rules={[{ required: true, message: "Priority is required." }]}
          >
            <Select
              size="small"
              options={priorities.map((p) => ({
                value: p,
                label: p,
              }))}
            />
          </Form.Item>
        ) : (
          <span className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${
            text === "High"
              ? "bg-red-100 text-red-600 border border-red-200"
              : text === "Medium"
              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
              : text === "Low"
              ? "bg-cyan-100 text-cyan-700 border border-cyan-200"
              : ""
          }`}>
            {text}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 90,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <a
              onClick={() => save(record._id || record.id)}
              style={{ marginRight: 8 }}
            >
              Save
            </a>
            <a onClick={cancel}>Cancel</a>
          </span>
        ) : (
          <a disabled={editingSubtaskKey !== ""} onClick={() => edit(record)}>
            Edit
          </a>
        );
      },
    },
  ];

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

  // Handle file attachment
  const handleAttachment = (e) => {
    if (!localTask?._id || !columnId) return;
    const files = Array.from(e.target.files);
    const prev = localTask.attachments || [];
    // Remove preview logic, just use files as is
    const filesToAdd = files;
    // Optimistically update localTask.attachments for UI
    setLocalTask((prevTask) => ({
      ...prevTask,
      attachments: [...(prevTask.attachments || []), ...filesToAdd],
    }));
    setTaskAttachments(localTask._id, columnId, [...prev, ...filesToAdd]);
    // Reset input value so same file can be uploaded again if needed
    e.target.value = "";
  };

  // Add a new subtask to the task using the create API, then re-fetch task
  const handleAddSubtask = async () => {
    if (!localTask?._id || !columnId) return;
    if (!newSubtask.trim()) return;

    // Compose the payload for subtask creation (backend expects taskdataId as parent _id)
    const payload = {
      title: newSubtask.trim(),
      description: '',
      status: localTask.status || columnId,
      priority: 'Medium',
      estimate: '',
      comments: [],
      attachments: [],
      tags: [],
      subtasks: [],
      taskType: 'subtask',
      taskdataId: localTask._id, // <-- correct key
    };

    try {
      await apiCreateTask(payload);
      setNewSubtask("");
      setShowSubtaskInput(false);
      // Optionally, re-fetch the task to update subtasks
      await refreshTask();
    } catch (err) {
      alert("Failed to create subtask");
    }
  };

  // --- RENDER MODAL UI ---
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="90vw"
      centered
      destroyOnClose
      bodyStyle={{
        padding: 0,
        borderRadius: 12,
        overflow: "hidden",
        background: "transparent",
        minHeight: 0,
        maxHeight: "80vh", // reduced from 90vh
        height: "auto",
        display: "flex",
        flexDirection: "column",
      }}
      style={{
        maxWidth: "98vw",
        width: "98vw",
        top: 16,
        margin: 0,
        padding: 0,
      }}
      className={`custom-task-modal`}
    >
       <div className="absolute left-8 top-4 z-20 bg-white dark:bg-gray-800">
          <Breadcrumb>
            <Breadcrumb.Item>
              <span
                className="text-gray-900 dark:text-white"
                style={{ cursor: isSubTask ? "pointer" : "default", fontWeight: isSubTask ? 600 : 700 }}
                onClick={isSubTask ? handleBreadcrumbTask : undefined}
              >
                Task
              </span>
            </Breadcrumb.Item>
            {isSubTask && activeSubTask && (
              <Breadcrumb.Item>
                <span className="text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>
                  {activeSubTask.title}
                </span>
              </Breadcrumb.Item>
            )}
          </Breadcrumb>
        </div>
      <div
        className={`${styles.modalParent} relative p-2 sm:p-4 md:p-6 min-w-0 w-full flex flex-col md:flex-row gap-4 md:gap-8 dark:border-gray-700 text-gray-900 dark:text-gray-100`}
        style={{
          minHeight: 0,
          maxHeight: "80vh", // reduced from 90vh
          height: "auto",
          boxSizing: "border-box",
          overflow: "visible",
          position: "relative",
          background: "inherit",
        }}
      >
        {/* --- BREADCRUMB --- */}
       
        {/* Spacer for close button */}
        <div style={{ height: 44, minHeight: 44, width: "100%", position: "absolute", top: 0, left: 0, zIndex: 1, pointerEvents: "none" }} />
        {/* ...existing code for modal content... */}
        <div
          className="flex-1 min-w-0"
          style={{
            maxHeight: "calc(80vh - 44px)", // reduced from 90vh
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            paddingTop: 44,
          }}
        >
          {/* Modal Title */}
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-2xl text-gray-900 dark:text-gray-100">
              {displayData?.title ||
                (mode === "update" ? "Update Task" : "Create New Task")}
            </div>
            {/* Status Dropdown - AntD with custom option rendering for exact design */}
            <div className={styles.antdDropdownFix} style={{ width: 144, marginRight: 10 }}>
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
              {!isSubTask && (
                <>
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
                </>
              )}
            </div>
            {/* Remove Status Dropdown from here */}
          </div>
          {/* Description */}
          <div className="mb-6">
            <div className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
              Description
            </div>
            <div className="relative">
              {!editingDescription ? (
                <textarea
                  className="w-full px-0 py-1 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-[16px] font-normal"
                  placeholder="Add a description..."
                  rows={1}
                  value={displayData?.description || ""}
                  readOnly
                  style={{
                    minHeight: "28px",
                    maxHeight: "120px",
                    overflow: "auto",
                  }}
                  onClick={handleEditDescription}
                />
              ) : (
                <>
                  <textarea
                    className="w-full px-0 py-1 bg-transparent border border-gray-300 dark:border-gray-700 outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-[16px] font-normal"
                    placeholder="Add a description..."
                    rows={3}
                    value={descriptionDraft}
                    onChange={handleDescriptionChange}
                    style={{
                      minHeight: "48px",
                      maxHeight: "120px",
                      overflow: "auto",
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium"
                      onClick={handleSaveEditDescription}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-gray-300 text-gray-700 text-sm font-medium"
                      onClick={handleCancelEditDescription}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
            {/* Attachments section */}
            {displayData?.attachments?.length > 0 && (
              <div className="mb-3">
                {/* Delete all and individual delete options */}
                <div className="flex items-center mb-2 justify-between">
                  <div className="flex items-center">
                    <span className="block font-semibold text-gray-700 dark:text-gray-300 mr-2">
                      Attachments
                    </span>
                    <span className="inline-block text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded px-2 py-0.5 font-semibold">
                      {displayData.attachments.length}
                    </span>
                  </div>
                  {/* <div className="flex gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-black text-white hover:bg-gray-800 font-semibold transition"
                      onClick={() => {
                        if (localTask?._id && columnId)
                          setTaskAttachments(localTask._id, columnId, []);
                      }}
                      type="button"
                    >
                      Delete All
                    </button>
                  </div> */}
                </div>
                <div className="flex flex-wrap gap-3">
                  {displayData.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="w-full sm:w-56 p-2 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden relative"
                      style={{ maxWidth: 224, minWidth: 0, flex: "1 1 160px" }}
                    >
                      {/* Delete single attachment button */}
                      <button
                        className="absolute top-1 right-1 z-10 bg-black text-white hover:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-xs transition"
                        title="Delete"
                        onClick={() => {
                          if (localTask?._id) {
                            // Remove from UI immediately
                            setLocalTask((prevTask) => ({
                              ...prevTask,
                              attachments: prevTask.attachments.filter((_, i) => i !== idx),
                            }));
                            // Update backend/store
                            const newAttachments = [...localTask.attachments];
                            newAttachments.splice(idx, 1);
                            setTaskAttachments(
                              localTask._id,
                              columnId,
                              newAttachments
                            );
                          }
                        }}
                        type="button"
                      >
                        &times;
                      </button>
                      {/* Only show title, download link, and date */}
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                          {
                            typeof file === "string"
                              ? (
                                  file.includes("\\") || file.includes("/")
                                    ? file.split(/[/\\]/).pop()
                                    : file
                                )
                              : file.name || "Attachment"
                          }
                        </div>
                        {/* Optionally, show download link if file is a string */}
                        {typeof file === "string" && (
                          <a
                            href={`/${file.replace(/\\/g, "/")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline mt-1"
                          >
                            Download
                          </a>
                        )}
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
                            : typeof file === "string"
                            ? ""
                            : "Just now"}
                        </div>
                      </div>
                    
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtasks Section */}
          <div className="mb-6">
            {!isSubTask && Array.isArray(localTask?.subtasks) && localTask.subtasks.length > 0 && (
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
                {/* Editable AntD Table */}
                <div className="overflow-x-auto mb-2 px-0 sm:px-2">
                  <Form form={form} component={false}>
                    <Table
                      dataSource={localTask.subtasks.map((sub, idx) => ({
                        ...sub,
                        key: sub._id || sub.id || idx,
                      }))}
                      columns={subtaskColumns.map((col) =>
                        col.key === "title"
                          ? {
                              ...col,
                              render: (text, record) =>
                                isEditing(record) ? (
                                  <Form.Item
                                    name="title"
                                    style={{ margin: 0 }}
                                    rules={[{ required: true, message: "Title is required." }]}
                                  >
                                    <Input size="small" />
                                  </Form.Item>
                                ) : (
                                  <span
                                    className="text-blue-600 underline cursor-pointer"
                                    onClick={() => handleSubtaskTitleClick(record)}
                                  >
                                    {text}
                                  </span>
                                ),
                            }
                          : col
                      )}
                      pagination={false}
                      rowClassName={(_, idx) =>
                        // Only apply hover:bg-gray-100 in light mode
                        `editable-row ${
                          idx % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800"
                        } hover:bg-gray-100 dark:hover:bg-inherit`
                      }
                      components={{
                        header: {
                          cell: (props) => (
                            <th
                              {...props}
                              className={
                                (props.className || "") +
                                " bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                              }
                              style={{
                                ...props.style,
                                backgroundColor: undefined,
                                color: undefined,
                              }}
                            >
                              {props.children}
                            </th>
                          ),
                        },
                        body: {
                          row: (props) => (
                            <tr
                              {...props}
                              className={props.className || ""}
                            >
                              {props.children}
                            </tr>
                          ),
                          cell: ({ children, ...restProps }) => (
                            <td
                              {...restProps}
                              className={
                                (restProps.className || "") +
                                " dark:text-white"
                              }
                            >
                              {children}
                            </td>
                          ),
                        },
                      }}
                      size="small"
                      bordered
                      className="min-w-[400px] w-full border border-gray-200 dark:border-gray-600 rounded text-xs"
                      scroll={{ x: 600 }}
                    />
                  </Form>
                </div>
              </>
            )}
            {/* Add Subtask Input */}
            {!isSubTask && showSubtaskInput && (
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
                  className={`px-3 py-1 rounded text-[12px] lg:text-base ${
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
              style={{ minHeight: "128px", maxHeight: "30vh", overflowY: "auto" }}
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
                      key={c._id}
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
                        {editingCommentId === c._id ? (
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
                              onClick={() => handleSaveEditComment(c._id)}
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
                            onClick={() => handleEditComment(c._id, c.text)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs text-red-600"
                            onClick={() => handleDeleteComment(c._id)}
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
                  {(!localTask?.history || localTask.history.length === 0) ? (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      No history yet.
                    </div>
                  ) : (
                    localTask.history.map((h, idx) => {
                      // Only show the part before the first ';' (inclusive)
                      let details = h.details || "";
                      const semiIdx = details.indexOf(";");
                      if (semiIdx !== -1) {
                        details = details.slice(0, semiIdx + 1);
                      }
                      return (
                        <div key={idx} className="mb-2 flex items-start gap-2">
                          {/* Remove avatar initial if you want only text, else keep */}
                          {/* <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-white font-bold">
                            {h.user && (h.user.name
                              ? h.user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2)
                              : typeof h.user === "string"
                                ? h.user.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2)
                                : "?")}
                          </div> */}
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {h.user && (h.user.name ? h.user.name : h.user)}
                            </span>
                            <span className="ml-2 font-normal text-gray-700 dark:text-gray-300">
                              {h.action ? ` ${h.action}:` : ""} {details}
                            </span>
                            <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                              {h.timestamp && new Date(h.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
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
        <div
          className="w-full md:w-80 flex-shrink-0 flex flex-col mt-6 md:mt-0"
          style={{
            maxWidth: "100%",
            minWidth: 0,
            overflow: "visible",
          }}
        >
          <div className="font-semibold text-base mb-3 text-gray-900 dark:text-gray-100">
            Details
          </div>
          {/* Assignee */}
          <div className="mb-3 flex items-center">
            <span className="w-24 text-gray-700 dark:text-gray-300">
              Assignee
            </span>
            <span className="flex-1 text-gray-900 dark:text-gray-100 min-w-0">
              <div className="w-full">
                {/* You may want to use displayData.assignee if available */}
                roshan devadiga
              </div>
            </span>
          </div>
          {/* Priority */}
          <div className="mb-3 flex items-center">
            <span className="w-24 text-gray-700 dark:text-gray-300">
              Priority
            </span>
            <div className={`${styles.antdDropdownFix} flex-1 min-w-0`} style={{ width: "100%" }}>
              <Select
                value={displayData?.priority || "High"}
                onChange={handlePriorityChange}
                style={{
                  width: "100%",
                  height: 32,
                  fontSize: 14,
                  borderRadius: 6,
                }}
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
            <div className="flex-1 min-w-0">
              <DatePicker
                className="w-full"
                style={{ width: "100%" }}
                value={displayData?.estimate ? moment(displayData.estimate) : null}
                onChange={handleEstimateChange}
                format="YYYY-MM-DD"
                allowClear
                placeholder="Select date"
                size="middle"
              />
            </div>
          </div>
          {/* ...existing code for more details fields if needed... */}
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
