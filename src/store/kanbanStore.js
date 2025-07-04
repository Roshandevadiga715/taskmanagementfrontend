import { create } from "zustand";
import { createTask as apiCreateTask, getAllTasks, updateTask } from "../api/taskRequest"; // <-- Add updateTask import

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

const initialTasks = {}; // Always start as empty object

function getNowISO() {
  return new Date().toISOString();
}

export const useKanbanStore = create((set, get) => ({
  columns: initialColumns,
  tasks: initialTasks,
  statusOptions,
  comments: {}, // { [taskId]: [{ id, text, user, timestamp }] }

  setTasks: (tasks) => set({ tasks }),

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
      if (!foundCol) return state; // Return current state instead of empty object
      
      const colTasks = state.tasks[foundCol].map((t) =>
        t.id === updatedTask.id ? { ...t, ...updatedTask } : t
      );
      return { 
        ...state, // Preserve other state
        tasks: { ...state.tasks, [foundCol]: colTasks } 
      };
    }),

  setTaskTimerFromSocket: (taskId, isRunning, timeSpent) =>
    set((state) => {
      const newTasks = { ...state.tasks };
      for (const col in newTasks) {
        newTasks[col] = newTasks[col].map((t) =>
          t.id === taskId ? { ...t, isRunning, timeSpent } : t
        );
      }
      return { 
        ...state, // Preserve other state
        tasks: newTasks 
      };
    }),

  // --- Timer actions (frontend triggers, also call backend/socket) ---
  setTaskTimer: (taskId, columnId, { isRunning, timeSpent }) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, isRunning, timeSpent } : t
      );
      if (!colTasks) return state; // Return current state if column doesn't exist
      
      return { 
        ...state, // Preserve other state
        tasks: { ...state.tasks, [columnId]: colTasks } 
      };
    }),

  moveTask: (taskId, sourceCol, destCol, destIdx) =>
    set((state) => {
      let updatedTask = null;
      if (sourceCol === destCol) {
        const colTasks = Array.from(state.tasks[sourceCol] || []);
        const taskIndex = colTasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return state; // Task not found

        const [removed] = colTasks.splice(taskIndex, 1);
        colTasks.splice(destIdx, 0, removed);

        updatedTask = { ...removed }; // No status change

        // Optimistically update state, then call API
        setTimeout(() => {
          if (updatedTask) updateTask(taskId, updatedTask).catch(() => {});
        }, 0);

        return {
          ...state,
          tasks: { ...state.tasks, [sourceCol]: colTasks }
        };
      } else {
        const sourceTasks = Array.from(state.tasks[sourceCol] || []);
        const taskIndex = sourceTasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return state; // Task not found

        const [removed] = sourceTasks.splice(taskIndex, 1);
        // Update the status for backend consistency
        updatedTask = { ...removed, status: destCol };
        const destTasks = Array.from(state.tasks[destCol] || []);
        destTasks.splice(destIdx, 0, updatedTask);

        // Optimistically update state, then call API
        setTimeout(() => {
          if (updatedTask) updateTask(taskId, updatedTask).catch(() => {});
        }, 0);

        return {
          ...state,
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
      const colTasks = state.tasks[columnId]?.map((task) =>
        task.id === taskId ? { ...task, title: newTitle } : task
      );
      if (!colTasks) return state; // Return current state if column doesn't exist
      
      // Optimistically update state, then call API
      setTimeout(() => {
        const updatedTask = colTasks.find((task) => task.id === taskId);
        if (updatedTask) updateTask(taskId, { ...updatedTask, taskType: updatedTask.taskType || "task" }).catch(() => {});
      }, 0);
      
      return {
        ...state, // Preserve other state
        tasks: {
          ...state.tasks,
          [columnId]: colTasks,
        },
      };
    }),

  updateTaskStatus: (taskId, newStatus) =>
    set((state) => {
      const tasks = { ...state.tasks };
      let taskFound = false;
      let updatedTask = null;
      
      for (const col in tasks) {
        const idx = tasks[col].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          const [task] = tasks[col].splice(idx, 1);
          task.status = newStatus;
          tasks[newStatus] = [...(tasks[newStatus] || []), task];
          updatedTask = task;
          taskFound = true;
          break;
        }
      }
      
      if (taskFound && updatedTask) {
        setTimeout(() => {
          updateTask(taskId, updatedTask).catch(() => {});
        }, 0);
      }
      
      if (!taskFound) return state; // Task not found
      
      return { 
        ...state, // Preserve other state
        tasks 
      };
    }),

  setTaskPriority: (taskId, columnId, newPriority) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, priority: newPriority } : t
      );
      if (!colTasks) return state; // Return current state if column doesn't exist
      
      // Optimistically update state, then call API
      setTimeout(() => {
        const updatedTask = colTasks.find((task) => task.id === taskId);
        if (updatedTask) updateTask(taskId, { ...updatedTask, taskType: updatedTask.taskType || "task" }).catch(() => {});
      }, 0);
      
      return { 
        ...state, // Preserve other state
        tasks: { ...state.tasks, [columnId]: colTasks } 
      };
    }),

  setTaskEstimate: (taskId, columnId, newEstimate) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, estimate: newEstimate } : t
      );
      if (!colTasks) return state; // Return current state if column doesn't exist
      
      // Optimistically update state, then call API
      setTimeout(() => {
        const updatedTask = colTasks.find((task) => task.id === taskId);
        if (updatedTask) updateTask(taskId, { ...updatedTask, taskType: updatedTask.taskType || "task" }).catch(() => {});
      }, 0);
      
      return { 
        ...state, // Preserve other state
        tasks: { ...state.tasks, [columnId]: colTasks } 
      };
    }),

  setTaskDescription: (taskId, columnId, newDescription) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, description: newDescription } : t
      );
      if (!colTasks) return state; // Return current state if column doesn't exist
      
      // Optimistically update state, then call API
      setTimeout(() => {
        const updatedTask = colTasks.find((task) => task.id === taskId);
        if (updatedTask) updateTask(taskId, { ...updatedTask, taskType: updatedTask.taskType || "task" }).catch(() => {});
      }, 0);
      
      return { 
        ...state, // Preserve other state
        tasks: { ...state.tasks, [columnId]: colTasks } 
      };
    }),

  setTaskAttachments: (taskId, columnId, newAttachments) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, attachments: newAttachments } : t
      );
      if (!colTasks) return state; // Return current state if column doesn't exist
      
      // Optimistically update state, then call API
      setTimeout(() => {
        const updatedTask = colTasks.find((task) => task.id === taskId);
        if (updatedTask) updateTask(taskId, { ...updatedTask, taskType: updatedTask.taskType || "task" }).catch(() => {});
      }, 0);
      
      return { 
        ...state, // Preserve other state
        tasks: { ...state.tasks, [columnId]: colTasks } 
      };
    }),

  setTaskSubtasks: (taskId, columnId, newSubtasks) =>
    set((state) => {
      const colTasks = state.tasks[columnId]?.map((t) =>
        t.id === taskId ? { ...t, subtasks: newSubtasks } : t
      );
      if (!colTasks) return state; // Return current state if column doesn't exist
      
      // Optimistically update state, then call API
      setTimeout(() => {
        const updatedTask = colTasks.find((task) => task.id === taskId);
        if (updatedTask) updateTask(taskId, { ...updatedTask, taskType: updatedTask.taskType || "task" }).catch(() => {});
      }, 0);
      
      return { 
        ...state, // Preserve other state
        tasks: { ...state.tasks, [columnId]: colTasks } 
      };
    }),

  getTaskById: (taskId) => {
    const tasks = get().tasks; // Use get() instead of useKanbanStore.getState()
    for (const col in tasks) {
      const found = tasks[col].find((task) => task.id === taskId);
      if (found) return found;
    }
    return null;
  },

  addTask: (columnId, taskData) =>
    set((state) => {
      const existingTasks = Object.values(state.tasks).flat();
      const newId = (
        Math.max(
          0,
          ...existingTasks.map((t) => parseInt(t.id, 10) || 0)
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
        ...state, // Preserve other state
        tasks: {
          ...state.tasks,
          [columnId]: [...(state.tasks[columnId] || []), newTask],
        },
      };
    }),

  createTask: async (taskData, columnId = "todo") => {
    // Determine if this is a subtask or a main task
    const isSubtask = !!taskData.taskDataId || !!taskData.taskdataId;
    const payload = {
      ...taskData,
      // Use correct key for parent id and taskType
      taskType: isSubtask ? "subtask" : "task",
      // Normalize parent id key for backend
      taskDataId: taskData.taskDataId || taskData.taskdataId,
    };
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = { ...payload, id: tempId };

    // Optimistically update tasks in the correct column
    set((state) => ({
      tasks: {
        ...state.tasks,
        [columnId]: [optimisticTask, ...(state.tasks[columnId] || [])],
      },
    }));

    try {
      const createdTask = await apiCreateTask(payload);
      // Replace temp task with real task from API
      set((state) => ({
        tasks: {
          ...state.tasks,
          [columnId]: state.tasks[columnId].map((t) =>
            t.id === tempId ? { ...createdTask, id: createdTask._id || createdTask.id } : t
          ),
        },
      }));
      return createdTask;
    } catch (error) {
      // On error, remove the optimistically added task
      set((state) => ({
        tasks: {
          ...state.tasks,
          [columnId]: (state.tasks[columnId] || []).filter((t) => t.id !== tempId),
        },
      }));
      throw error;
    }
  },

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
        ...state, // Preserve other state
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
        ...state, // Preserve other state
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
        ...state, // Preserve other state
        comments: {
          ...state.comments,
          [taskId]: prev.filter((c) => c.id !== commentId),
        },
      };
    }),

  fetchAndSetTasks: async () => {
    try {
      const data = await getAllTasks();
      const columnsList = get().columns;
      const tasksByColumn = {};
      columnsList.forEach((col) => {
        tasksByColumn[col.id] = [];
      });
      data.forEach((task) => {
        let col = (task.status || "").toLowerCase().replace(/\s/g, "");
        if (!columnsList.some((c) => c.id === col)) {
          col = "backlog";
        }
        tasksByColumn[col].push({
          ...task,
          id: task._id || task.id,
        });
      });
      set({ tasks: tasksByColumn });
    } catch (error) {
      // On error, initialize with empty columns
      const columnsList = get().columns;
      const emptyTasks = {};
      columnsList.forEach((col) => {
        emptyTasks[col.id] = [];
      });
      set({ tasks: emptyTasks });
      throw error;
    }
  },
}));