import { useState, useEffect } from 'react';
import { validateTodoTitle, validateDates } from '../../utils/validation';
import { formatDate } from '../../utils/dateHelpers';
import Spinner from '../Loading/Spinner';

const TodoForm = ({ isOpen, onClose, onSubmit, initialData = null, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        startDate: formatDate(initialData.startDate) || '',
        endDate: formatDate(initialData.endDate) || '',
      });
    } else {
      setFormData({
        title: '',
        startDate: '',
        endDate: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

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

    const titleError = validateTodoTitle(formData.title);
    if (titleError) newErrors.title = titleError;

    const dateError = validateDates(formData.startDate, formData.endDate);
    if (dateError) newErrors.dates = dateError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      title: formData.title.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">
          {initialData ? '할일 수정' : '새 할일 추가'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              할일 제목 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.title ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="할일 제목을 입력하세요"
              maxLength={500}
            />
            {errors.title && <p className="mt-1 text-sm text-error">{errors.title}</p>}
            <p className="mt-1 text-xs text-gray-500">{formData.title.length}/500</p>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              시작일 *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.dates ? 'border-error' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              종료일 *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.dates ? 'border-error' : 'border-gray-300'
              }`}
            />
            {errors.dates && <p className="mt-1 text-sm text-error">{errors.dates}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? <Spinner size="sm" /> : initialData ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoForm;
