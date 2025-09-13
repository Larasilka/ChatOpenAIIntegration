import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Show success message for signup
        if (data.user && !data.session) {
          setMessage('Регистрация успешна! Проверьте email для подтверждения.');
        } else if (data.session) {
          setMessage('Регистрация и вход выполнены успешно!');
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setMessage('Ссылка для сброса пароля отправлена на ваш email');
      }
    } catch (error: any) {
      if (error.message?.includes('User already registered') || error.code === 'user_already_exists') {
        setError('Этот email уже зарегистрирован. Попробуйте войти в систему.');
        // Automatically switch to login mode after a short delay
        setTimeout(() => {
          setMode('login');
          setError('');
        }, 2000);
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Неверные данные для входа. Проверьте email и пароль.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Подтвердите email перед входом. Проверьте почту.');
      } else if (error.message?.includes('Password should be at least')) {
        setError('Пароль должен быть не менее 6 символов.');
      } else if (error.message?.includes('Unable to validate email address')) {
        setError('Неверный формат email.');
      } else {
        // Log the full error for debugging
        console.error('Auth error:', error);
        setError(error.message || 'Произошла ошибка. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'login' ? 'Добро пожаловать обратно' : mode === 'signup' ? 'Создание аккаунта' : 'Сброс пароля'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === 'login' 
              ? 'Войдите, чтобы продолжить работу с чатами' 
              : mode === 'signup' 
              ? 'Зарегистрируйтесь, чтобы начать общение с AI'
              : 'Введите email для получения ссылки сброса пароля'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад ко входу
            </button>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Введите ваш email"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Введите ваш пароль"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-green-600 dark:text-green-400 text-sm">{message}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {mode === 'login' ? 'Вход...' : mode === 'signup' ? 'Создание аккаунта...' : 'Отправка ссылки...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {mode === 'login' ? <LogIn className="w-5 h-5 mr-2" /> : mode === 'signup' ? <UserPlus className="w-5 h-5 mr-2" /> : <Mail className="w-5 h-5 mr-2" />}
                {mode === 'login' ? 'Войти' : mode === 'signup' ? 'Создать аккаунт' : 'Отправить ссылку'}
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button
                onClick={() => setMode('reset')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium block w-full"
              >
                Забыли пароль?
              </button>
              <button
                onClick={() => setMode('signup')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Нет аккаунта? Зарегистрироваться
              </button>
            </>
          )}
          
          {mode === 'signup' && (
            <button
              onClick={() => setMode('login')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Уже есть аккаунт? Войти
            </button>
          )}
        </div>
      </div>
    </div>
  );
};