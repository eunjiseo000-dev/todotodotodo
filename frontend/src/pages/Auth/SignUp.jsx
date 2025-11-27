import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validatePasswordConfirm, validateName } from '../../utils/validation';
import Spinner from '../../components/Loading/Spinner';

const SignUp = () => {
  const navigate = useNavigate();
  const { signup, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 입력 시 에러 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmError = validatePasswordConfirm(formData.password, formData.confirmPassword);
    if (confirmError) newErrors.confirmPassword = confirmError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      // 토스트 메시지를 3초 동안 표시한 후 대시보드로 이동
      await new Promise((resolve) => setTimeout(resolve, 3000));
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-paper p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary">회원가입</h1>
        <p className="text-center text-gray-600 mb-8">ToDoToDoToDo에 오신 것을 환영합니다</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.name ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="이름을 입력하세요"
            />
            {errors.name && <p className="mt-1 text-sm text-error">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.email ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="example@email.com"
            />
            {errors.email && <p className="mt-1 text-sm text-error">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.password ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="최소 6자 이상"
            />
            {errors.password && <p className="mt-1 text-sm text-error">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.confirmPassword ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="비밀번호를 다시 입력하세요"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-error">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <Spinner size="sm" /> : '회원가입'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link to="/" className="text-primary hover:text-primary-dark font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
