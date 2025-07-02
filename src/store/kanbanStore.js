import { create } from "zustand";

export const modalStatusOptions = [
  { value: "backlog", label: "Backlog", color: "bg-gray-200 text-gray-700" },
  { value: "todo", label: "To Do", color: "bg-blue-100 text-blue-700" },
  { value: "inprogress", label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  { value: "review", label: "Review", color: "bg-purple-100 text-purple-700" },
  { value: "completed", label: "Completed", color: "bg-green-200 text-green-800" },
];

export const statusToColumn = {
  backlog: "backlog",
  todo: "todo",
  inprogress: "inprogress",
  review: "review",
  completed: "completed",
};

export const columnToStatus = {
  backlog: "backlog",
  todo: "todo",
  inprogress: "inprogress",
  review: "review",
  completed: "completed",
};

export const priorities = ["High", "Medium", "Low"];

const statusOptions = [
  { value: "todo", label: "TO DO", color: "bg-gray-200 text-gray-700" },
  { value: "approved", label: "APPROVED", color: "bg-blue-100 text-blue-700" },
  { value: "indesign", label: "In Design", color: "bg-blue-500 text-white" },
  { value: "usertesting", label: "USER TESTING", color: "bg-blue-200 text-blue-800" },
  { value: "live", label: "LIVE", color: "bg-green-200 text-green-800" },
];

const initialColumns = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "inprogress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "completed", title: "Completed" },
];

const initialTasks = {
  backlog: [
    { id: "1", title: "Setup Database Schema", priority: "High", estimate: "2h", status: "backlog" },
    { id: "2", title: "Design User Interface", priority: "Medium", estimate: "4h", status: "backlog" },
  ],
  todo: [
    { id: "3", title: "API Integration", priority: "High", estimate: "3h", status: "todo" },
  ],
  inprogress: [
    { id: "4", title: "User Authentication", priority: "Medium", estimate: "2h", status: "inprogress" },
  ],
  review: [
    { id: "5", title: "Testing Suite", priority: "Low", estimate: "1h", status: "review" },
  ],
  completed: [
    { id: "6", title: "Project Initialization", priority: "Low", estimate: "1h", status: "completed" },
  ],
};

function getNowISO() {
  return new Date().toISOString();
}

export const useKanbanStore = create((set, get) => ({
  columns: initialColumns,
  tasks: initialTasks,
  statusOptions,
  comments: {}, // { [taskId]: [{ id, text, user, timestamp }] }

  // --- Real-time update handlers ---
  updateTaskFromSocket: (updatedTask) =>
    set((state) => {
      let foundCol = null;
      for (const col in state.tasks) {
        if (state.tasks[col].some((t) => t.id === updatedTask.id)) {
          foundCol = col;
          break;
        }
      }
      if (!foundCol) return {};
      const colTasks = state.tasks[foundCol].map((t) =>
        t.id === updatedTask.id ? { ...t, ...updatedTask } : t
      );
      return { tasks: { ...state.tasks, [foundCol]: colTasks } };
    }),

  setTaskTimerFromSocket: (taskId, isRunning, timeSpent) =>
    set((state) => {
      for (const col in state.tasks) {
        state.tasks[col] = state.tasks[col].map((t) =>
          t.id === taskId ? { ...t, isRunning, timeSpent } : t
        );
      }
      return { tasks: { ...state.tasks } };
    }),

  // --- Timer actions (frontend triggers, also call backend/socket) ---
  setTaskTimer: (taskId, columnId, { isRunning, timeSpent }) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, isRunning, timeSpent } : t
      );
      return { tasks: { ...state.tasks, [columnId]: colTasks } };
    }),

  moveTask: (taskId, sourceCol, destCol, destIdx) =>
    set((state) => {
      if (sourceCol === destCol) {
        const colTasks = Array.from(state.tasks[sourceCol]);
        const [removed] = colTasks.splice(
          colTasks.findIndex((t) => t.id === taskId),
          1
        );
        colTasks.splice(destIdx, 0, removed);
        return { tasks: { ...state.tasks, [sourceCol]: colTasks } };
      } else {
        const sourceTasks = Array.from(state.tasks[sourceCol]);
        const [removed] = sourceTasks.splice(
          sourceTasks.findIndex((t) => t.id === taskId),
          1
        );
        const destTasks = Array.from(state.tasks[destCol] || []);
        destTasks.splice(destIdx, 0, removed);
        return {
          tasks: {
            ...state.tasks,
            [sourceCol]: sourceTasks,
            [destCol]: destTasks,
          },
        };
      }
    }),

  editTaskTitle: (taskId, columnId, newTitle) =>
    set((state) => {
      const tasks = { ...state.tasks };
      const colTasks = tasks[columnId]?.map((task) =>
        task.id === taskId ? { ...task, title: newTitle } : task
      );
      if (!colTasks) return { tasks };
      return {
        tasks: {
          ...tasks,
          [columnId]: colTasks,
        },
      };
    }),

  updateTaskStatus: (taskId, newStatus) =>
    set((state) => {
      const tasks = { ...state.tasks };
      for (const col in tasks) {
        const idx = tasks[col].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          const [task] = tasks[col].splice(idx, 1);
          task.status = newStatus;
          tasks[newStatus] = [...(tasks[newStatus] || []), task];
          break;
        }
      }
      return { tasks };
    }),

  setTaskPriority: (taskId, columnId, newPriority) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, priority: newPriority } : t
      );
      return { tasks: { ...state.tasks, [columnId]: colTasks } };
    }),

  setTaskEstimate: (taskId, columnId, newEstimate) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, estimate: newEstimate } : t
      );
      return { tasks: { ...state.tasks, [columnId]: colTasks } };
    }),

  setTaskDescription: (taskId, columnId, newDescription) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, description: newDescription } : t
      );
      return { tasks: { ...state.tasks, [columnId]: colTasks } };
    }),

  setTaskAttachments: (taskId, columnId, newAttachments) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, attachments: newAttachments } : t
      );
      return { tasks: { ...state.tasks, [columnId]: colTasks } };
    }),

  setTaskSubtasks: (taskId, columnId, newSubtasks) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, subtasks: newSubtasks } : t
      );
      return { tasks: { ...state.tasks, [columnId]: colTasks } };
    }),

  getTaskById: (taskId) => {
    const tasks = useKanbanStore.getState().tasks;
    for (const col in tasks) {
      const found = tasks[col].find((task) => task.id === taskId);
      if (found) return found;
    }
    return null;
  },

  addTask: (columnId, taskData) =>
    set((state) => {
      const newId = (
        Math.max(
          0,
          ...Object.values(state.tasks)
            .flat()
            .map((t) => parseInt(t.id, 10) || 0)
        ) + 1
      ).toString();
      const newTask = {
        id: newId,
        title: taskData.title || "Untitled",
        priority: taskData.priority || "Medium",
        estimate: taskData.estimate || "",
        status: columnId,
        ...taskData,
      };
      return {
        tasks: {
          ...state.tasks,
          [columnId]: [...(state.tasks[columnId] || []), newTask],
        },
      };
    }),

  addComment: (taskId, text, user = "User") =>
    set((state) => {
      const prev = state.comments[taskId] || [];
      const newComment = {
        id: Date.now().toString(),
        text,
        user,
        timestamp: getNowISO(),
      };
      return {
        comments: {
          ...state.comments,
          [taskId]: [...prev, newComment],
        },
      };
    }),

  editComment: (taskId, commentId, newText) =>
    set((state) => {
      const prev = state.comments[taskId] || [];
      return {
        comments: {
          ...state.comments,
          [taskId]: prev.map((c) =>
            c.id === commentId ? { ...c, text: newText, edited: true } : c
          ),
        },
      };
    }),

  deleteComment: (taskId, commentId) =>
    set((state) => {
      const prev = state.comments[taskId] || [];
      return {
        comments: {
          ...state.comments,
          [taskId]: prev.filter((c) => c.id !== commentId),
        },
      };
    }),
}));
