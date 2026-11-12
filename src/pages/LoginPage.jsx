
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  LoaderCircle,
} from 'lucide-react';

import { supabase } from '../supabase';
import { siteSettings } from '../siteSetting';

const LoginPage = () => {
  const navigate = useNavigate();

  const { primary, accent, fontSans, fontDisplay } = siteSettings.theme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    },

    onSuccess: (data) => {
      if (data.user) {
        navigate('/');
      }
    },

    onError: (err) => {
      setMessage('');

      if (err.message === 'Invalid login credentials') {
        setError(
          "Incorrect email or password. If you don't have an account, please sign up."
        );
      } else if (err.message === 'Email not confirmed') {
        setError(
          'Your email address is not confirmed yet. Please check your inbox and confirm your email.'
        );
      } else if (err.status === 429) {
        setError(
          'Too many login attempts. Please wait a moment and try again.'
        );
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    },
  });

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    loginMutation.mutate({
      email: email.trim().toLowerCase(),
      password,
    });
  };

  const loading = loginMutation.isPending;

  return (
    <main
      dir="ltr"
      className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#111111] px-5 py-12"
      style={{ fontFamily: fontSans }}
    >
      <div className="w-full max-w-md">

        {/* Back to Home */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/10 bg-[#191919] p-7 shadow-2xl sm:p-9">

          {/* Logo */}
          <div className="mb-8 text-center">
            <img
              src="./assets/images/logo.png"
              alt={`${siteSettings.name} Logo`}
              className="mx-auto mb-5 h-16 w-16 object-contain"
            />

            <h1
              className="text-3xl font-extrabold tracking-wide"
              style={{ color: accent, fontFamily: fontDisplay }}
            >
              Welcome Back
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Sign in to your {siteSettings.name} account
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-400">
              {message}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-gray-600"
                  onFocus={(e) => {
                    e.target.style.borderColor = primary;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-300">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold transition-colors hover:opacity-75"
                  style={{ color: primary }}
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] py-3.5 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-gray-600"
                  onFocus={(e) => {
                    e.target.style.borderColor = primary;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: primary,
                color: accent,
              }}
            >
              {loading ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                'Log In'
              )}
            </button>

            {/* Sign Up */}
            <div className="pt-2 text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-bold transition-colors hover:opacity-75"
                  style={{ color: primary }}
                >
                  Sign Up
                </Link>
              </p>
            </div>

          </form>
        </div>

        {/* Brand Footer */}
        <p className="mt-7 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} {siteSettings.name}. All rights reserved.
        </p>

      </div>
    </main>
  );
};

export default LoginPage;
