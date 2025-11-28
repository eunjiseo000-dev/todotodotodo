import { createContext, useState, useCallback } from 'react';
import { todoAPI } from '../services/api';
import { toast } from '../utils/toast';

export const TodoContext = createContext(null);

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('active'); // active | completed | deleted
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 할일 목록 조회
  const fetchTodos = useCallback(async (status) => {
    try {
      setLoading(true);
      setError(null);
      const response = await todoAPI.getTodos(status);
      setTodos(response.data.data.todos || []);
    } catch (err) {
      const message = err.response?.data?.message || '할일 목록을 불러오는데 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 모든 필터의 개수 조회
  const getCounts = useCallback(async () => {
    try {
      const [activeRes, completedRes, deletedRes] = await Promise.all([
        todoAPI.getTodos('active'),
        todoAPI.getTodos('completed'),
        todoAPI.getTodos('deleted'),
      ]);

      return {
        active: activeRes.data.data.todos?.length || 0,
        completed: completedRes.data.data.todos?.length || 0,
        deleted: deletedRes.data.data.todos?.length || 0,
      };
    } catch (err) {
      console.error('개수 조회 실패:', err);
      return { active: 0, completed: 0, deleted: 0 };
    }
  }, []);

  // 할일 추가
  const addTodo = async (todoData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await todoAPI.createTodo(todoData);
      toast.success('할일이 추가되었습니다.');
      return { success: true, todo: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || '할일 추가에 실패했습니다.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 할일 수정
  const updateTodo = async (id, todoData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await todoAPI.updateTodo(id, todoData);
      toast.success('할일이 수정되었습니다.');
      return { success: true, todo: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || '할일 수정에 실패했습니다.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 할일 삭제 (휴지통으로 이동)
  const deleteTodo = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await todoAPI.deleteTodo(id);
      toast.success('할일이 휴지통으로 이동되었습니다.');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || '할일 삭제에 실패했습니다.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 할일 복원
  const restoreTodo = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await todoAPI.restoreTodo(id);
      toast.success('할일이 복원되었습니다.');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || '할일 복원에 실패했습니다.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 할일 완료 토글
  const toggleComplete = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await todoAPI.toggleComplete(id);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || '할일 상태 변경에 실패했습니다.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 우선순위 재정렬
  const reorderTodo = async (id, newPriority) => {
    try {
      setLoading(true);
      setError(null);
      await todoAPI.reorderTodo(id, { priority: newPriority });
      toast.success('우선순위가 변경되었습니다.');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || '우선순위 변경에 실패했습니다.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 영구 삭제
  const permanentDeleteTodo = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await todoAPI.permanentDeleteTodo(id);
      toast.success('할일이 영구 삭제되었습니다.');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || '영구 삭제에 실패했습니다.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    todos,
    filter,
    setFilter,
    loading,
    error,
    fetchTodos,
    getCounts,
    addTodo,
    updateTodo,
    deleteTodo,
    restoreTodo,
    toggleComplete,
    reorderTodo,
    permanentDeleteTodo,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};
