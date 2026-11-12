
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, LoaderCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // التأكد إن المستخدم وصل من لينك استعادة كلمة المرور
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      setValidSession(!error && !!data.session);
      setChecking(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' && session) {
        setValidSession(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);

    // تسجيل الخروج بعد تغيير كلمة المرور
    await supabase.auth.signOut();

    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 2500);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center text-white">
        <LoaderCircle className="animate-spin text-[#14A7CD]" size={35} />
      </div>
    );
  }

  if (!validSession) {
    return (
      <div dir="ltr" className="min-h-screen bg-[#111] flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-[#171717] border border-white/10 rounded-2xl p-8 text-center">
          <Lock size={42} className="text-[#14A7CD] mx-auto mb-5" />

          <h1 className="text-2xl font-bold text-white mb-3">
            Invalid or Expired Link
          </h1>

          <p className="text-gray-400 mb-7">
            This password reset link is invalid or has expired.
            Please request a new password reset link.
          </p>

          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 bg-[#14A7CD] hover:bg-[#146A96] text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div dir="ltr" className="min-h-screen bg-[#111] flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-[#171717] border border-white/10 rounded-2xl p-8 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-5" />

          <h1 className="text-2xl font-bold text-white mb-3">
            Password Updated!
          </h1>

          <p className="text-gray-400">
            Your password has been changed successfully.
            Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir="ltr" className="min-h-screen bg-[#111] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md bg-[#171717] border border-white/10 rounded-2xl p-8 shadow-2xl">

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft size={17} />
          Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#14A7CD]/10 flex items-center justify-center mx-auto mb-5">
            <Lock size={30} className="text-[#14A7CD]" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            Reset Password
          </h1>

          <p className="text-gray-400">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                className="w-full bg-[#111] border border-white/10 rounded-lg py-3 pl-11 pr-12 text-white outline-none focus:border-[#14A7CD] transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />

              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className="w-full bg-[#111] border border-white/10 rounded-lg py-3 pl-11 pr-12 text-white outline-none focus:border-[#14A7CD] transition"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#14A7CD] hover:bg-[#146A96] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoaderCircle size={19} className="animate-spin" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
