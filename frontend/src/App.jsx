import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TodoProvider } from './context/TodoContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Dashboard from './pages/Dashboard/Dashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <TodoProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </Router>
      </TodoProvider>
    </AuthProvider>
  );
}

export default App;
