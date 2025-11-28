import { useState } from 'react';
import { formatDateKorean } from '../../utils/dateHelpers';
import ConfirmDialog from '../Dialog/ConfirmDialog';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TodoItem = ({ todo, onToggleComplete, onEdit, onDelete, onRestore, onPermanentDelete, filter }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.todoId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    await onDelete(todo.todoId);
    setShowDeleteDialog(false);
  };

  const handlePermanentDelete = () => {
    setShowPermanentDeleteDialog(true);
  };

  const confirmPermanentDelete = async () => {
    await onPermanentDelete(todo.todoId);
    setShowPermanentDeleteDialog(false);
  };

  const isActive = filter === 'active';
  const isCompleted = filter === 'completed';
  const isDeleted = filter === 'deleted';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-lg shadow-sm p-4 mb-3 border-l-4 ${
          todo.isCompleted ? 'border-success' : 'border-primary'
        } hover:shadow-md transition-shadow`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {(isActive || isCompleted) && (
              <div
                {...attributes}
                {...listeners}
                className="inline-block cursor-move mr-2 text-gray-400 hover:text-gray-600"
              >
                ⋮⋮
              </div>
            )}
            <h3
              className={`text-lg font-medium mb-2 ${
                todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
              }`}
            >
              {todo.title}
            </h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p>시작: {formatDateKorean(todo.startDate)}</p>
              <p>종료: {formatDateKorean(todo.endDate)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {isActive && (
              <>
                <button
                  onClick={() => onToggleComplete(todo.todoId)}
                  className="px-3 py-1 text-sm bg-success text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  완료
                </button>
                <button
                  onClick={() => onEdit(todo)}
                  className="px-3 py-1 text-sm bg-info text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-sm bg-error text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </>
            )}

            {isCompleted && (
              <>
                <button
                  onClick={() => onToggleComplete(todo.todoId)}
                  className="px-3 py-1 text-sm bg-warning text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  미완료
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-sm bg-error text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </>
            )}

            {isDeleted && (
              <>
                <button
                  onClick={() => onRestore(todo.todoId)}
                  className="px-3 py-1 text-sm bg-success text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  복원
                </button>
                <button
                  onClick={handlePermanentDelete}
                  className="px-3 py-1 text-sm bg-error text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  영구삭제
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="할일 삭제"
        message="이 할일을 휴지통으로 이동하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText="삭제"
        cancelText="취소"
      />

      <ConfirmDialog
        isOpen={showPermanentDeleteDialog}
        title="영구 삭제"
        message="이 할일을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={confirmPermanentDelete}
        onCancel={() => setShowPermanentDeleteDialog(false)}
        confirmText="영구삭제"
        cancelText="취소"
      />
    </>
  );
};

export default TodoItem;
