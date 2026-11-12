
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import {
  UserRound,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  LoaderCircle,
} from 'lucide-react';

import { supabase } from '../supabase';
import { siteSettings } from '../siteSetting';

const SignupPage = () => {
  const navigate = useNavigate();

  const { primary, accent, fontSans, fontDisplay } = siteSettings.theme;

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility
  const [showPasswords, setShowPasswords] = useState(false);

  // Messages
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // React Query Mutation
  const signupMutation = useMutation({
    mutationFn: async (formData) => {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
          },
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },

    onSuccess: (data) => {
      // Check if email is already registered
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setMessage('');
        setError(
          'This email is already registered. Please log in to your account.'
        );
        return;
      }

      // Account created and logged in
      if (data.session) {
        navigate('/');
        return;
      }

      // Email confirmation required
      setError('');
      setMessage(
        'Your account has been created! Please check your email to confirm your account.'
      );
    },

    onError: (err) => {
      console.error('Signup Error:', err);

      const errorMessage = err.message?.toLowerCase() || '';

      if (
        errorMessage.includes('already registered') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('already been registered')
      ) {
        setMessage('');
        setError(
          'This email is already registered. Please log in to your account.'
        );
      } else {
        setMessage('');
        setError(err.message || 'Something went wrong. Please try again.');
      }
    },
  });

  // Handle Form Submit
  const handleSignup = (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    signupMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      password,
    });
  };

  // Shared Input Style
  const inputClasses =
    'w-full rounded-lg border border-white/10 bg-[#111111] py-3.5 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-gray-600';

  const handleInputFocus = (e) => {
    e.target.style.borderColor = primary;
  };

  const handleInputBlur = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
  };

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

        {/* Signup Card */}
        <div className="rounded-2xl border border-white/10 bg-[#191919] p-7 shadow-2xl sm:p-9">

          {/* Logo */}
          <div className="mb-8 text-center">
            <img
              src={siteSettings.logo}
              alt={`${siteSettings.name} Logo`}
              className="mx-auto mb-5 h-16 w-16 object-contain"
            />

            <h1
              className="text-3xl font-extrabold tracking-wide"
              style={{
                color: accent,
                fontFamily: fontDisplay,
              }}
            >
              Create Account
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Join {siteSettings.name} and start your learning journey
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
            <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-400">
              {message}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Full Name
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                  className={inputClasses}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

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
                  className={inputClasses}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Phone Number
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                  autoComplete="tel"
                  className={inputClasses}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClasses}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />

                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-white"
                >
                  {showPasswords ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Confirm Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClasses}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />

                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-white"
                >
                  {showPasswords ? (
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
              disabled={signupMutation.isPending}
              className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: primary,
                color: accent,
              }}
            >
              {signupMutation.isPending ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

          </form>

          {/* Login Link */}
          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
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

export default SignupPage;
