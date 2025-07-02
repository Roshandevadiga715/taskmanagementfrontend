import { useEffect } from "react";
import { io } from "socket.io-client";
import { useKanbanStore } from "../store/kanbanStore";

// You may want to set this to your backend URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

let socket;

export default function useSocket() {
  const updateTaskFromSocket = useKanbanStore((s) => s.updateTaskFromSocket);
  const setTaskTimer = useKanbanStore((s) => s.setTaskTimerFromSocket);

  useEffect(() => {
    socket = io(SOCKET_URL, { transports: ["websocket"] });

    // Listen for task updates
    socket.on("task:update", (task) => {
      updateTaskFromSocket(task);
    });

    // Listen for timer updates
    socket.on("timer:update", ({ taskId, isRunning, timeSpent }) => {
      setTaskTimer(taskId, isRunning, timeSpent);
    });

    return () => {
      socket.disconnect();
    };
  }, [updateTaskFromSocket, setTaskTimer]);

  // Expose emitters for timer actions
  const emitTimerAction = (taskId, action, timeSpent) => {
    if (!socket) return;
    socket.emit("timer:action", { taskId, action, timeSpent });
  };

  return { emitTimerAction };
}
