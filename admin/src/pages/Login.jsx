import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { SESSION_EXPIRED_KEY } from '../api/axiosInstance';
import Icon from '../components/Icon';
import { Spinner } from '../components/PageLoader';

const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 30;
const LOCK_KEY = 'jishya_admin_login_lock_until';

function readLockUntil() {
  try {
    const value = Number(sessionStorage.getItem(LOCK_KEY));
    return Number.isFinite(value) && value > Date.now() ? value : 0;
  } catch (e) {
    return 0;
  }
}

function writeLockUntil(value) {
  try {
    if (value) sessionStorage.setItem(LOCK_KEY, String(value));
    else sessionStorage.removeItem(LOCK_KEY);
  } catch (e) {
    /* ignore */
  }
}

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(readLockUntil);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil((readLockUntil() - Date.now()) / 1000));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });

  // Tell the user why they were sent back here.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_EXPIRED_KEY)) {
        sessionStorage.removeItem(SESSION_EXPIRED_KEY);
        toast('Your session has ended. Please sign in again.', { icon: '🔒' });
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  // Countdown while the form is locked after too many failures.
  useEffect(() => {
    if (!lockUntil) return undefined;
    const tick = () => {
      const left = Math.ceil((lockUntil - Date.now()) / 1000);
      if (left <= 0) {
        setLockUntil(0);
        setSecondsLeft(0);
        setFailedAttempts(0);
        setSubmitError('');
        writeLockUntil(0);
      } else {
        setSecondsLeft(left);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lockUntil]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const locked = lockUntil > 0 && secondsLeft > 0;

  async function onSubmit({ email, password }) {
    if (locked) return;
    setSubmitError('');
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const status = err.response && err.response.status;
      let message;
      if (status === 401) message = 'Incorrect email or password.';
      else if (status === 429) message = 'Too many attempts from this network. Please wait a few minutes and try again.';
      else if (status === 400) message = 'Please check the email and password you entered.';
      else if (err.request && !err.response) message = 'Cannot reach the server. Check your connection and try again.';
      else message = 'Something went wrong. Please try again.';
      setSubmitError(message);

      const attempts = failedAttempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_SECONDS * 1000;
        writeLockUntil(until);
        setSecondsLeft(LOCK_SECONDS);
        setLockUntil(until);
      } else {
        setFailedAttempts(attempts);
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={`${import.meta.env.BASE_URL}jishya.png`} alt="Dr. Jishya" className="mx-auto h-20 w-auto" />
          <p className="mt-1 text-xs font-medium uppercase tracking-[.2em] text-ink-soft">Admin Dashboard</p>
        </div>

        <div className="card p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-ink-soft">Enter your credentials to manage the website.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
            {submitError && (
              <div role="alert" className="rounded-md border border-accent/30 bg-accent-light px-4 py-3 text-sm text-accent-dark">
                {submitError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  maxLength: { value: 255, message: 'Email is too long' },
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                })}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-xs text-accent">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    maxLength: { value: 72, message: 'Password must be 72 characters or fewer' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-soft hover:text-ink"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" />
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-xs text-accent">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting || locked} className="btn btn-primary w-full py-2.5">
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {locked ? `Try again in ${secondsLeft}s` : isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            {locked && (
              <p role="status" className="text-center text-xs text-ink-soft">
                Too many failed attempts. Sign-in is paused for {LOCK_SECONDS} seconds.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
