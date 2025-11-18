import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { ExchangeIcon } from './IconComponents';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignup: (name: string, email: string, password: string) => Promise<boolean>;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignup }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    if (isForgotPasswordView) {
      // Handle password reset request
      if (!email) {
        setError('Please enter your email address.');
        return;
      }

      setResetLoading(true);
      try {
        const res = await apiClient.auth.requestPasswordReset(email);
        if (res?.success) {
          setResetMessage(
            'If an account with that email exists, a password reset link has been sent.'
          );
        } else if (res?.error) {
          setError(res.error || 'Failed to request password reset.');
        } else {
          setResetMessage(
            'If an account with that email exists, a password reset link has been sent.'
          );
        }
      } catch (err) {
        console.error('Forgot password error:', err);
        setError('Failed to request password reset. Please try again.');
      } finally {
        setResetLoading(false);
      }
      return;
    }

    setLoading(true);

    let success = false;
    if (isLoginView) {
      success = await onLogin(email, password);
      if (!success) {
        setError('Invalid email or password.');
      }
    } else {
      success = await onSignup(name, email, password);
      if (!success) {
        setError('Could not create account. The email might already be in use.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center items-center gap-2 mb-8">
        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-purple-500 opacity-80 blur-md" />
          <div className="relative inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-zinc-950 text-white shadow-lg shadow-indigo-500/40">
            <ExchangeIcon className="w-6 h-6" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase">
            Skillshare
          </span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
            Learn. Teach. Repeat.
          </span>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-zinc-900/85 rounded-2xl shadow-2xl shadow-indigo-100/40 dark:shadow-black/60 p-8 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
        <h2 className="text-2xl font-bold text-center text-zinc-800 dark:text-zinc-100 mb-2">
          {isForgotPasswordView
            ? 'Reset your password'
            : isLoginView
            ? 'Welcome Back!'
            : 'Create an Account'}
        </h2>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          {isForgotPasswordView
            ? 'Enter the email associated with your account and we will send you a reset link.'
            : isLoginView
            ? 'Log in to continue matching with people who can learn from you or help you grow.'
            : 'Join a curated peer-to-peer community for focused learning and collaboration.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginView && !isForgotPasswordView && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
                required
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
              required
            />
          </div>

          {!isForgotPasswordView && (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
              required
            />
          </div>
          )}

          {resetMessage && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              {resetMessage}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || resetLoading}
            className="w-full mt-2 px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400"
          >
            {loading || resetLoading
              ? 'Processing...'
              : isForgotPasswordView
              ? 'Send reset link'
              : isLoginView
              ? 'Log In'
              : 'Sign Up'}
          </button>
        </form>

        {!isForgotPasswordView && isLoginView && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsForgotPasswordView(true);
                setError(null);
                setResetMessage(null);
              }}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Forgot your password?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (isForgotPasswordView) {
                setIsForgotPasswordView(false);
                setResetMessage(null);
              } else {
                setIsLoginView(!isLoginView);
              }
              setError(null);
            }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {isForgotPasswordView
              ? 'Back to login'
              : isLoginView
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};