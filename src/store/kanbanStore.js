import { create } from "zustand";

const initialColumns = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "inprogress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "completed", title: "Completed" },
];

const initialTasks = {
  backlog: [
    { id: "1", title: "Setup Database Schema", priority: "High", estimate: "2h" },
    { id: "2", title: "Design User Interface", priority: "Medium", estimate: "4h" },
  ],
  todo: [
    { id: "3", title: "API Integration", priority: "High", estimate: "3h" },
  ],
  inprogress: [
    { id: "4", title: "User Authentication", priority: "Medium", estimate: "2h" },
  ],
  review: [
    { id: "5", title: "Testing Suite", priority: "Low", estimate: "1h" },
  ],
  completed: [
    { id: "6", title: "Project Initialization", priority: "Low", estimate: "1h" },
  ],
};

export const useKanbanStore = create((set) => ({
  columns: initialColumns,
  tasks: initialTasks,
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
        console.log("Reordered within column:", updated.tasks);
        return updated;
      } else {
        // Move between columns
        const sourceTasks = [...state.tasks[sourceCol]];
        const destTasks = [...state.tasks[destCol]];
        const taskIdx = sourceTasks.findIndex((t) => t.id === taskId);
        if (taskIdx === -1) return {};
        const [task] = sourceTasks.splice(taskIdx, 1);
        destTasks.splice(destIdx, 0, task);
        const updated = {
          tasks: {
            ...state.tasks,
            [sourceCol]: sourceTasks,
            [destCol]: destTasks,
          },
        };
        console.log("Moved between columns:", updated.tasks);
        return updated;
      }
    }),
}));
