import { useState, useEffect } from 'react';
import TodoItem from './TodoItem';
import TodoForm from '../TodoForm/TodoForm';
import { useTodos } from '../../hooks/useTodos';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const TodoList = ({ todos, filter, onMutate }) => {
  const { addTodo, updateTodo, deleteTodo, restoreTodo, toggleComplete, reorderTodo, permanentDeleteTodo, loading, fetchTodos } = useTodos();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [localTodos, setLocalTodos] = useState(todos);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // todos prop이 변경되면 localTodos도 업데이트
  useEffect(() => {
    setLocalTodos(todos);
  }, [todos]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = localTodos.findIndex((todo) => todo.todoId === active.id);
      const newIndex = localTodos.findIndex((todo) => todo.todoId === over.id);

      const reorderedTodos = arrayMove(localTodos, oldIndex, newIndex);
      setLocalTodos(reorderedTodos);

      // 새 우선순위 계산 (1부터 시작)
      const newPriority = newIndex + 1;
      await handleReorderTodo(active.id, newPriority);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (todoData) => {
    if (editingTodo) {
      const result = await updateTodo(editingTodo.todoId, todoData);
      if (result.success) {
        setIsFormOpen(false);
        setEditingTodo(null);
        await refreshCurrentFilter();
        if (onMutate) await onMutate();
      }
    } else {
      const result = await addTodo(todoData);
      if (result.success) {
        setIsFormOpen(false);
        await refreshCurrentFilter();
        if (onMutate) await onMutate();
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTodo(null);
  };

  // Helper: Refresh current filter and update other filter counts
  const refreshCurrentFilter = async () => {
    setLocalTodos([]);
    await fetchTodos(filter);
  };

  // Wrap mutation functions to refresh after completion
  const handleToggleComplete = async (id) => {
    await toggleComplete(id);
    await refreshCurrentFilter();
    if (onMutate) await onMutate();
  };

  const handleDeleteTodo = async (id) => {
    await deleteTodo(id);
    await refreshCurrentFilter();
    if (onMutate) await onMutate();
  };

  const handleRestoreTodo = async (id) => {
    await restoreTodo(id);
    await refreshCurrentFilter();
    if (onMutate) await onMutate();
  };

  const handlePermanentDeleteTodo = async (id) => {
    await permanentDeleteTodo(id);
    await refreshCurrentFilter();
    if (onMutate) await onMutate();
  };

  const handleReorderTodo = async (id, newPriority) => {
    await reorderTodo(id, newPriority);
    await refreshCurrentFilter();
    if (onMutate) await onMutate();
  };

  if (todos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {filter === 'active' && '진행중인 할일이 없습니다.'}
          {filter === 'completed' && '완료된 할일이 없습니다.'}
          {filter === 'deleted' && '휴지통이 비어있습니다.'}
        </p>
        {filter === 'active' && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            새 할일 추가하기
          </button>
        )}

        <TodoForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          initialData={editingTodo}
          loading={loading}
        />
      </div>
    );
  }

  const displayTodos = localTodos.length > 0 ? localTodos : todos;

  return (
    <div>
      {filter !== 'deleted' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayTodos.map((t) => t.todoId)} strategy={verticalListSortingStrategy}>
            {displayTodos.map((todo) => (
              <TodoItem
                key={todo.todoId}
                todo={todo}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDeleteTodo}
                onRestore={handleRestoreTodo}
                onPermanentDelete={handlePermanentDeleteTodo}
                filter={filter}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        displayTodos.map((todo) => (
          <TodoItem
            key={todo.todoId}
            todo={todo}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDeleteTodo}
            onRestore={handleRestoreTodo}
            onPermanentDelete={handlePermanentDeleteTodo}
            filter={filter}
          />
        ))
      )}

      <TodoForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingTodo}
        loading={loading}
      />
    </div>
  );
};

export default TodoList;
