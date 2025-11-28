import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTodos } from '../../hooks/useTodos';
import TabNav from '../../components/Tab/TabNav';
import TodoList from '../../components/TodoList/TodoList';
import TodoForm from '../../components/TodoForm/TodoForm';
import Spinner from '../../components/Loading/Spinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { todos, filter, setFilter, fetchTodos, getCounts, getCountForFilter, addTodo, loading } = useTodos();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [counts, setCounts] = useState({
    active: 0,
    completed: 0,
    deleted: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // 초기 로드 시 모든 필터의 개수 가져오기 (의존성 배열에 함수 제외)
  useEffect(() => {
    const initializeCounts = async () => {
      const counts = await getCounts();
      setCounts(counts);
      // 현재 필터로 설정
      await fetchTodos(filter);
    };

    initializeCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTodos(filter);
  }, [filter, fetchTodos]);

  useEffect(() => {
    // todos가 변경될 때마다 현재 필터의 개수 업데이트
    setCounts((prev) => ({
      ...prev,
      [filter]: todos.length,
    }));
  }, [todos, filter]);

  const handleTabChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Helper: Refresh all filter counts for real-time updates
  // 현재 필터의 개수는 todos.length로 대체하여 API 호출 최소화
  const refreshAllCounts = async () => {
    const otherFilters = filter === 'active' ? ['completed', 'deleted'] :
                        filter === 'completed' ? ['active', 'deleted'] :
                        ['active', 'completed'];

    const updatedCounts = { ...counts, [filter]: todos.length };

    // 다른 필터들의 개수만 병렬로 조회
    const results = await Promise.all(
      otherFilters.map(f => getCountForFilter(f))
    );

    otherFilters.forEach((f, index) => {
      updatedCounts[f] = results[index];
    });

    setCounts(updatedCounts);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddTodo = async (todoData) => {
    const result = await addTodo(todoData);
    if (result.success) {
      setIsFormOpen(false);
      await fetchTodos(filter);
    }
  };

  const tabs = [
    { label: '진행중', value: 'active', count: counts.active },
    { label: '완료', value: 'completed', count: counts.completed },
    { label: '휴지통', value: 'deleted', count: counts.deleted },
  ];

  return (
    <div className="min-h-screen bg-background-paper">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">ToDoToDoToDo</h1>
              {user && <p className="text-sm text-gray-600">안녕하세요, {user.name}님</p>}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">내 할일</h2>
            {filter === 'active' && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                + 새 할일
              </button>
            )}
          </div>

          <TabNav tabs={tabs} activeTab={filter} onTabChange={handleTabChange} />

          {/* 로딩 상태를 즉시 표시 */}
          {loading && todos.length === 0 ? (
            <div className="py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="relative">
              <TodoList todos={todos} filter={filter} onMutate={refreshAllCounts} />
              {/* 데이터는 있지만 로딩 중일 때 오버레이 표시 */}
              {loading && todos.length > 0 && (
                <div className="absolute inset-0 bg-white bg-opacity-40 flex items-center justify-center rounded-lg">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <TodoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddTodo}
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;
