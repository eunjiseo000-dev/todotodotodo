import { useContext } from 'react';
import { TodoContext } from '../context/TodoContext';

export const useTodos = () => {
  const context = useContext(TodoContext);

  if (!context) {
    throw new Error('useTodos는 TodoProvider 내에서 사용되어야 합니다.');
  }

  return context;
};
