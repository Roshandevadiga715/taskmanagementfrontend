import React, { useState, useEffect } from "react";
import Column from "./Column";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useKanbanStore } from "../../store/kanbanStore";
import TaskDetailModal from "../common/TaskDetailModal";

const Board = () => {
  // Use selector for rendering (reactive)
  const columns = useKanbanStore((s) => s.columns);
  const moveTask = useKanbanStore((s) => s.moveTask);
  const setTasks = useKanbanStore((s) => s.setTasks);
  const fetchAndSetTasks = useKanbanStore((s) => s.fetchAndSetTasks);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTaskId, setModalTaskId] = useState(null);
  const [modalTaskType, setModalTaskType] = useState("task");
  const [isLoading, setIsLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      destination.index
    );

    // Remove the setTimeout that was causing issues
    // The state update is now synchronous through Zustand
  };

  // Handler to open modal with task id/type
  const handleCardClick = (task) => {
    setModalTaskId(task.id);
    setModalTaskType("task");
    setModalOpen(true);
  };

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        await fetchAndSetTasks();
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []); // Only run once on mount

  if (isLoading) {
    return (
      <div className="container mx-auto min-h-0 py-3 px-2 sm:px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Loading tasks...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="container mx-auto min-h-0 py-3 px-2 sm:px-4">
          <div className="flex flex-nowrap gap-6 sm:gap-4 p-2 sm:p-4 w-full h-full overflow-x-auto bg-white dark:bg-gray-900 transition">
            {columns.map((col) => (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="w-full sm:w-auto"
                  >
                    <Column
                      title={col.title}
                      columnId={col.id}
                      onCardClick={handleCardClick}
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>
      <TaskDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        taskId={modalTaskId}
        taskType={modalTaskType}
        mode="update"
      />
    </>
  );
};

export default Board;