
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import {
  Mail,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
} from 'lucide-react';

import { supabase } from '../supabase';
import { siteSettings } from '../siteSetting';

const ForgotPasswordPage = () => {
  const { primary, accent, fontSans, fontDisplay } = siteSettings.theme;

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Reset Password Email Mutation
  const resetMutation = useMutation({
    mutationFn: async (userEmail) => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        userEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      setError('');
      setMessage(
        'If an account exists with this email, password reset instructions will be sent to your inbox. Please check your email.'
      );
    },

    onError: (err) => {
      setMessage('');
      setError(
        err.message || 'Unable to send the reset email. Please try again.'
      );
    },
  });

  // Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    resetMutation.mutate(email.trim().toLowerCase());
  };

  return (
    <main
      dir="ltr"
      className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#111111] px-5 py-12"
      style={{ fontFamily: fontSans }}
    >
      <div className="w-full max-w-md">

        {/* Back to Login */}
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Login
        </Link>

        {/* Forgot Password Card */}
        <div className="rounded-2xl border border-white/10 bg-[#191919] p-7 shadow-2xl sm:p-9">

          {/* Logo */}
          <div className="mb-8 text-center">
            <img
              src={siteSettings.logo}
              alt={`${siteSettings.name} Logo`}
              className="mx-auto mb-5 h-16 w-16 object-contain"
            />

            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: `${primary}20` }}
            >
              <Mail size={25} style={{ color: primary }} />
            </div>

            <h1
              className="text-3xl font-extrabold tracking-wide"
              style={{ color: accent, fontFamily: fontDisplay }}
            >
              Forgot Password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Don't worry! Enter your email address and we'll send you a link
              to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-400">
              {error}
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="mb-5 flex gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-400">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <p>{message}</p>
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

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
                  placeholder="Enter your email address"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: primary,
                color: accent,
              }}
            >
              {resetMutation.isPending ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

          </form>

          {/* Back to Login */}
          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-gray-400">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-bold transition-colors hover:opacity-75"
                style={{ color: primary }}
              >
                Log In
              </Link>
            </p>
          </div>

        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} {siteSettings.name}. All rights reserved.
        </p>

      </div>
    </main>
  );
};

export default ForgotPasswordPage;
