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

const columnStatusMap = {
  backlog: "backlog",
  todo: "todo",
  inprogress: "inprogress",
  review: "review",
  completed: "completed",
};

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

export const useKanbanStore = create((set) => ({
  columns: initialColumns,
  tasks: initialTasks,
  statusOptions,
  moveTask: (taskId, sourceCol, destCol, destIdx) =>
    set((state) => {
      if (sourceCol === destCol) {
        // Reorder within the same column
        const newTasks = [...state.tasks[sourceCol]];
        const fromIdx = newTasks.findIndex((t) => t.id === taskId);
        if (fromIdx === -1) return {};
        const [task] = newTasks.splice(fromIdx, 1);
        newTasks.splice(destIdx, 0, task);
        const updated = {
          tasks: {
            ...state.tasks,
            [sourceCol]: newTasks,
          },
        };
        return updated;
      } else {
        // Move between columns and update status according to column
        const sourceTasks = [...state.tasks[sourceCol]];
        const destTasks = [...state.tasks[destCol]];
        const taskIdx = sourceTasks.findIndex((t) => t.id === taskId);
        if (taskIdx === -1) return {};
        let [task] = sourceTasks.splice(taskIdx, 1);
        // Update status based on destination column
        const newStatus = columnStatusMap[destCol] || task.status;
        task = { ...task, status: newStatus };
        // If destIdx is -1, push to end
        if (destIdx === -1 || destIdx > destTasks.length) {
          destTasks.push(task);
        } else {
          destTasks.splice(destIdx, 0, task);
        }
        const updated = {
          tasks: {
            ...state.tasks,
            [sourceCol]: sourceTasks,
            [destCol]: destTasks,
          },
        };
        return updated;
      }
    }),
  editTaskTitle: (taskId, columnId, newTitle) =>
    set((state) => {
      const tasks = { ...state.tasks };
      const colTasks = tasks[columnId]?.map((task) =>
        task.id === taskId ? { ...task, title: newTitle } : task
      );
      if (!colTasks) return {};
      return {
        tasks: {
          ...tasks,
          [columnId]: colTasks,
        },
      };
    }),
  updateTaskStatus: (taskId, newStatus) =>
    set((state) => {
      // Find the task in all columns and update its status
      const tasks = { ...state.tasks };
      for (const col in tasks) {
        tasks[col] = tasks[col].map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        );
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
}));
