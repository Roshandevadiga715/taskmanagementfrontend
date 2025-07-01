import React, { useState } from "react";
import Column from "./Column";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useKanbanStore } from "../../store/kanbanStore";
import TaskDetailModal from "../common/TaskDetailModal";

const Board = () => {
  const columns = useKanbanStore((s) => s.columns);
  const moveTask = useKanbanStore((s) => s.moveTask);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState(null);

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

    setTimeout(() => {
      const updatedTasks = useKanbanStore.getState().tasks;
      console.log("Updated tasks state:", updatedTasks);
    }, 0);
  };

  // Handler to open modal with task data, always resets state
  const handleCardClick = (task) => {
    setModalOpen(false);
    setModalTask(null);
    setTimeout(() => {
      setModalTask(task);
      setModalOpen(true);
    }, 0);
  };

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
        task={modalTask}
        mode="update"
      />
    </>
  );
};

export default Board;
