import React, { useState } from "react";
import Column from "./Column";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useKanbanStore } from "../../store/kanbanStore";
import TaskDetailModal from "../common/TaskDetailModal";

const Board = () => {
  const columns = useKanbanStore((s) => s.columns);
  const tasks = useKanbanStore((s) => s.tasks);
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

    // Log the updated state after moving the card
    setTimeout(() => {
      const updatedTasks = useKanbanStore.getState().tasks;
      console.log("Updated tasks state:", updatedTasks);
    }, 0);

    // Show modal only if moved to a different column
    if (source.droppableId !== destination.droppableId) {
      const task = tasks[source.droppableId].find((t) => t.id === draggableId);
      setModalTask(task);
      setModalOpen(true);
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-wrap  gap-6 sm:gap-4 p-2 sm:p-4 overflow-x-auto bg-gray-900 transition h-[100vh]">
          {columns.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-full sm:w-auto"
                >
                  <Column title={col.title} columnId={col.id} />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
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
