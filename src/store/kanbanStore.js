import { create } from "zustand";
import { createTask as apiCreateTask, getAllTasks, updateTask, getTaskById } from "../api/taskRequest"; // <-- Add updateTask import

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
      // Try to find as parent task first
      let parentCol = null;
      let parentIdx = -1;
      let parentTask = null;
      for (const col in state.tasks) {
        const idx = state.tasks[col].findIndex(
          (t) => t.id === taskId || t._id === taskId
        );
        if (idx !== -1) {
          parentCol = col;
          parentIdx = idx;
          parentTask = state.tasks[col][idx];
          break;
        }
      }
      // If found as parent, update its subtasks (normal case)
      if (parentTask) {
        const colTasks = state.tasks[parentCol].map((t, idx) =>
          idx === parentIdx ? { ...t, subtasks: newSubtasks } : t
        );
        setTimeout(() => {
          const updatedTask = colTasks[parentIdx];
          if (updatedTask) updateTask(updatedTask.id, { ...updatedTask, taskType: updatedTask.taskType || "task" }).catch(() => {});
        }, 0);
        return {
          ...state,
          tasks: { ...state.tasks, [parentCol]: colTasks },
        };
      }
      // If not found as parent, try to find as subtask
      for (const col in state.tasks) {
        for (let i = 0; i < state.tasks[col].length; i++) {
          const parent = state.tasks[col][i];
          const subIdx = (parent.subtasks || []).findIndex(
            (sub) => sub.id === taskId || sub._id === taskId
          );
          if (subIdx !== -1) {
            // Replace only the subtask at subIdx with newSubtasks[0] (the updated subtask)
            const updatedSubtasks = [...(parent.subtasks || [])];
            updatedSubtasks[subIdx] = { ...updatedSubtasks[subIdx], ...newSubtasks[0] };
            const updatedParent = { ...parent, subtasks: updatedSubtasks };
            const colTasks = [...state.tasks[col]];
            colTasks[i] = updatedParent;
            setTimeout(() => {
              const subtask = updatedSubtasks[subIdx];
              if (subtask) updateTask(subtask.id || subtask._id, { ...subtask, taskType: "subtask" }).catch(() => {});
            }, 0);
            return {
              ...state,
              tasks: { ...state.tasks, [col]: colTasks },
            };
          }
        }
      }
      // If not found, do nothing
      return state;
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
    // --- SUBTASK LOGIC ---
    if (isSubtask) {
      // Find parent task in all columns
      const parentId = payload.taskDataId;
      let parentCol = null;
      let parentIdx = -1;
      let parentTask = null;
      const tasks = get().tasks;
      for (const col in tasks) {
        const idx = tasks[col].findIndex(
          (t) => t.id === parentId || t._id === parentId
        );
        if (idx !== -1) {
          parentCol = col;
          parentIdx = idx;
          parentTask = tasks[col][idx];
          break;
        }
      }
      if (!parentTask) throw new Error("Parent task not found in store");

      // Optimistically add subtask to parent
      const optimisticSubtask = { ...payload, id: tempId };
      set((state) => {
        const newTasks = { ...state.tasks };
        const parent = { ...parentTask };
        parent.subtasks = [...(parent.subtasks || []), optimisticSubtask];
        newTasks[parentCol] = [
          ...newTasks[parentCol].slice(0, parentIdx),
          parent,
          ...newTasks[parentCol].slice(parentIdx + 1),
        ];
        return { tasks: newTasks };
      });

      try {
        const createdTask = await apiCreateTask(payload);
        // Replace temp subtask with real subtask in parent
        set((state) => {
          const newTasks = { ...state.tasks };
          const parent = { ...parentTask };
          parent.subtasks = (parent.subtasks || []).map((t) =>
            t.id === tempId ? { ...createdTask, id: createdTask._id || createdTask.id } : t
          );
          newTasks[parentCol] = [
            ...newTasks[parentCol].slice(0, parentIdx),
            parent,
            ...newTasks[parentCol].slice(parentIdx + 1),
          ];
          return { tasks: newTasks };
        });
        return createdTask;
      } catch (error) {
        // Remove temp subtask on error
        set((state) => {
          const newTasks = { ...state.tasks };
          const parent = { ...parentTask };
          parent.subtasks = (parent.subtasks || []).filter((t) => t.id !== tempId);
          newTasks[parentCol] = [
            ...newTasks[parentCol].slice(0, parentIdx),
            parent,
            ...newTasks[parentCol].slice(parentIdx + 1),
          ];
          return { tasks: newTasks };
        });
        throw error;
      }
    }
    // --- MAIN TASK LOGIC ---
    const optimisticTask = { ...payload, id: tempId };
    set((state) => ({
      tasks: {
        ...state.tasks,
        [columnId]: [optimisticTask, ...(state.tasks[columnId] || [])],
      },
    }));

    try {
      const createdTask = await apiCreateTask(payload);
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
      set((state) => ({
        tasks: {
          ...state.tasks,
          [columnId]: (state.tasks[columnId] || []).filter((t) => t.id !== tempId),
        },
      }));
      throw error;
    }
  },

  addComment: async (taskId, text, user = "User") => {
    // Find the task in the store
    let updatedTaskObj = null;
    let colName = null;
    let idx = -1;
    const state = get();
    for (const col in state.tasks) {
      idx = state.tasks[col].findIndex((t) => t.id === taskId || t._id === taskId);
      if (idx !== -1) {
        updatedTaskObj = { ...state.tasks[col][idx] };
        colName = col;
        break;
      }
    }
    if (!updatedTaskObj) return;

    // Prepare updated comments array (without fake _id)
    const newComment = {
      text,
      user,
      timestamp: getNowISO(),
    };
    const updatedComments = [...(updatedTaskObj.comments || []), newComment];

    // Optimistically update UI (without _id)
    set((state) => {
      const updatedTasks = { ...state.tasks };
      const updatedTask = { ...updatedTaskObj, comments: updatedComments };
      updatedTasks[colName][idx] = updatedTask;
      return {
        ...state,
        comments: {
          ...state.comments,
          [taskId]: updatedComments,
        },
        tasks: updatedTasks,
      };
    });

    // Call backend to update task (or add comment)
    try {
      await updateTask(taskId, { ...updatedTaskObj, comments: updatedComments, taskType: updatedTaskObj.taskType || "task" });
      // Fetch the latest task from backend to get real comments with real _id
      const latest = await getTaskById(taskId, updatedTaskObj.taskType || "task");
      const realComments = latest.comments || [];
      set((state) => {
        const updatedTasks = { ...state.tasks };
        if (colName !== null && idx !== -1) {
          updatedTasks[colName][idx] = { ...updatedTaskObj, comments: realComments };
        }
        return {
          ...state,
          comments: {
            ...state.comments,
            [taskId]: realComments,
          },
          tasks: updatedTasks,
        };
      });
    } catch (e) {
      // Optionally: revert optimistic update or show error
    }
  },

  editComment: (taskId, commentId, newText) =>
    set((state) => {
      const prev = state.comments[taskId] || [];
      // Only update text and edited, never touch _id
      const updatedComments = prev.map((c) =>
        c._id === commentId
          ? { ...c, text: newText, edited: true } // _id is preserved
          : c
      );

      // Update the task's comments array and hit updateTask API
      let updatedTasks = { ...state.tasks };
      let updatedTaskObj = null;
      for (const col in updatedTasks) {
        const idx = updatedTasks[col].findIndex((t) => t.id === taskId || t._id === taskId);
        if (idx !== -1) {
          updatedTaskObj = { ...updatedTasks[col][idx] };
          updatedTaskObj.comments = updatedComments;
          updatedTasks[col] = [
            ...updatedTasks[col].slice(0, idx),
            updatedTaskObj,
            ...updatedTasks[col].slice(idx + 1),
          ];
          break;
        }
      }
      if (updatedTaskObj) {
        setTimeout(() => {
          updateTask(taskId, { ...updatedTaskObj, taskType: updatedTaskObj.taskType || "task" }).catch(() => {});
        }, 0);
      }

      return {
        ...state,
        comments: {
          ...state.comments,
          [taskId]: updatedComments,
        },
        tasks: updatedTasks,
      };
    }),

  deleteComment: (taskId, commentId) =>
    set((state) => {
      const prev = state.comments[taskId] || [];
      // Only match and delete by _id, do not touch _id of others
      const updatedComments = prev.filter((c) => c._id !== commentId);

      // Update the task's comments array and hit updateTask API
      let updatedTasks = { ...state.tasks };
      let updatedTaskObj = null;
      for (const col in updatedTasks) {
        const idx = updatedTasks[col].findIndex((t) => t.id === taskId || t._id === taskId);
        if (idx !== -1) {
          updatedTaskObj = { ...updatedTasks[col][idx] };
          updatedTaskObj.comments = updatedComments;
          updatedTasks[col] = [
            ...updatedTasks[col].slice(0, idx),
            updatedTaskObj,
            ...updatedTasks[col].slice(idx + 1),
          ];
          break;
        }
      }
      if (updatedTaskObj) {
        setTimeout(() => {
          updateTask(taskId, { ...updatedTaskObj, taskType: updatedTaskObj.taskType || "task" }).catch(() => {});
        }, 0);
      }

      return {
        ...state,
        comments: {
          ...state.comments,
          [taskId]: updatedComments,
        },
        tasks: updatedTasks,
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
      // --- Collect comments for each task into the comments store ---
      const commentsByTask = {};
      data.forEach((task) => {
        let col = (task.status || "").toLowerCase().replace(/\s/g, "");
        if (!columnsList.some((c) => c.id === col)) {
          col = "backlog";
        }
        tasksByColumn[col].push({
          ...task,
          id: task._id || task.id,
        });
        // If task has comments array, store it in comments store
        if (Array.isArray(task.comments) && (task._id || task.id)) {
          commentsByTask[task._id || task.id] = task.comments;
        }
      });
      set({ tasks: tasksByColumn, comments: commentsByTask });
    } catch (error) {
      // On error, initialize with empty columns
      const columnsList = get().columns;
      const emptyTasks = {};
      columnsList.forEach((col) => {
        emptyTasks[col.id] = [];
      });
      set({ tasks: emptyTasks, comments: {} });
      throw error;
    }
  },
}));