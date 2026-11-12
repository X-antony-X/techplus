
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { siteSettings } from '../siteSetting';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function CheckoutPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    sender_phone: '',
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptError, setReceiptError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [paymentId, setPaymentId] = useState(null);

  const primary = siteSettings.theme.primary;
  const secondary = siteSettings.theme.secondary;

  // Fetch selected course
  const {
    data: course,
    isLoading: courseLoading,
    isError: courseError,
  } = useQuery({
    queryKey: ['checkout-course', courseId],

    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          price,
          thumbnail_url,
          instructor_name,
          access_type,
          status
        `)
        .eq('id', courseId)
        .eq('status', 'published')
        .eq('access_type', 'paid')
        .single();

      if (error) throw error;

      if (!data || Number(data.price) <= 0) {
        throw new Error('This course is not available for purchase.');
      }

      return data;
    },

    enabled: Boolean(courseId),
  });

  // Get logged-in user
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
  } = useQuery({
    queryKey: ['checkout-user'],

    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) throw error;

      return data.user;
    },
  });

  // Get user profile
  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: ['checkout-profile', user?.id],

    enabled: Boolean(user?.id),

    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
  });

  // Update form fields
  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Prefill user information
  useEffect(() => {
    if (!user) return;

    setForm((previous) => ({
      ...previous,
      full_name: previous.full_name || profile?.full_name || '',
      phone_number: previous.phone_number || profile?.phone_number || '',
      email: previous.email || user.email || '',
    }));
  }, [user, profile]);

  // Submit payment
  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('Please log in before submitting your payment.');
      }

      if (!course) {
        throw new Error('Course information is not available.');
      }

      if (!form.full_name.trim()) {
        throw new Error('Please enter your full name.');
      }

      if (!form.phone_number.trim()) {
        throw new Error('Please enter your phone number.');
      }

      if (!form.email.trim()) {
        throw new Error('Please enter your email address.');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        throw new Error('Please enter a valid email address.');
      }

      if (!form.sender_phone.trim()) {
        throw new Error('Please enter the sender wallet number.');
      }

      if (!receiptFile) {
        throw new Error('Please upload your payment receipt.');
      }

      if (!ALLOWED_TYPES.includes(receiptFile.type)) {
        throw new Error('Receipt must be JPG, PNG, or WEBP.');
      }

      if (receiptFile.size > MAX_FILE_SIZE) {
        throw new Error('Receipt image must be 5 MB or smaller.');
      }

      // Upload receipt to private Supabase Storage bucket
      const safeFileName = receiptFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      );

      const filePath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, receiptFile, {
          contentType: receiptFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Receipt upload failed: ${uploadError.message}`);
      }

      // Create pending payment
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          payment_method: 'vodafone_cash',
          status: 'pending',
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone_number: form.phone_number.trim(),
          sender_phone: form.sender_phone.trim(),
          amount: course.price,
          receipt_url: filePath,
        })
        .select('id')
        .single();

      if (error) throw error;

      return data;
    },

    onSuccess: (data) => {
      setPaymentId(data.id);
      setSubmitError('');
    },

    onError: (error) => {
      console.error('Payment submission error:', error);

      setSubmitError(
        error.message || 'Something went wrong. Please try again.'
      );
    },
  });

  const formatPrice = (price) =>
    `${Number(price || 0).toLocaleString('en-US')} EGP`;

  // Loading
  if (courseLoading || userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        Loading checkout...
      </div>
    );
  }

  // Course not found
  if (courseError || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-5 text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Course not available
        </h2>

        <p className="mt-3 text-gray-500">
          This course may no longer be available for purchase.
        </p>

        <button
          onClick={() => navigate('/payment')}
          className="mt-6 rounded-lg px-6 py-3 font-semibold text-white"
          style={{ backgroundColor: primary }}
        >
          Back to courses
        </button>
      </div>
    );
  }

  // Payment success
  if (paymentId) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-12"
        style={{ fontFamily: siteSettings.theme.fontSans }}
      >
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white"
            style={{ backgroundColor: primary }}
          >
            ✓
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Payment submitted successfully!
          </h1>

          <p className="mt-3 leading-7 text-gray-600">
            Your payment request is now pending review. Your course access
            will be activated after the payment is verified by our team.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            Payment reference:

            <p className="mt-1 break-all font-bold text-gray-900">
              {paymentId}
            </p>
          </div>

          <button
            onClick={() => navigate('/courses')}
            className="mt-6 w-full rounded-lg px-5 py-3 font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            Back to courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6"
      style={{ fontFamily: siteSettings.theme.fontSans }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-8 text-center">
          <img
            src={siteSettings.logo}
            alt={siteSettings.name}
            className="mx-auto mb-4 h-14 object-contain"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />

          <h1
            className="text-3xl font-bold text-gray-900 sm:text-4xl"
            style={{ fontFamily: siteSettings.theme.fontDisplay }}
          >
            Complete Your Purchase
          </h1>

          <p className="mt-3 text-gray-500">
            Complete the information below to enroll in your course.
          </p>
        </div>

        {/* Login Notice */}
        {!user && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You need to log in before submitting a payment.

            <button
              onClick={() =>
                navigate(
                  `/login?redirect=${encodeURIComponent(`/checkout/${courseId}`)}`
                )
              }
              className="ml-2 font-bold underline"
            >
              Log in
            </button>
          </div>
        )}

        {userError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Unable to verify your account. Please refresh the page.
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">

          {/* Checkout Form */}
          <form
            className="space-y-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitError('');
              paymentMutation.mutate();
            }}
          >
            {/* Personal Information */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Your Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Please enter your contact details.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(event) =>
                      updateForm('full_name', event.target.value)
                    }
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Phone Number *
                  </label>

                  <input
                    type="tel"
                    required
                    value={form.phone_number}
                    onChange={(event) =>
                      updateForm('phone_number', event.target.value)
                    }
                    placeholder="01xxxxxxxxx"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Email Address *
                  </label>

                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) =>
                      updateForm('email', event.target.value)
                    }
                    placeholder="example@email.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Payment Information */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Payment Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Transfer the course amount using Vodafone Cash.
              </p>

              {/* Payment Method */}
              <div className="mt-5 rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-800">
                    Payment Method
                  </span>

                  <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                    Vodafone Cash
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-gray-500">
                    Transfer to this number
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-2xl font-bold tracking-wider text-gray-900">
                      {siteSettings.contact.vodaphoneCash}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(siteSettings.contact.vodaphoneCash)
                          .catch((error) => {
                            console.error('Copy failed:', error);
                          });
                      }}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: secondary }}
                    >
                      Copy Number
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                  Please transfer the exact course amount, then upload a clear
                  screenshot or photo of your payment receipt.
                </div>
              </div>

              {/* Sender Phone */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Sender Wallet Number *
                </label>

                <input
                  type="tel"
                  required
                  value={form.sender_phone}
                  onChange={(event) =>
                    updateForm('sender_phone', event.target.value)
                  }
                  placeholder="Number you transferred from"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Receipt Upload */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Payment Receipt *
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-cyan-500">
                  <span className="text-3xl">↑</span>

                  <span className="mt-3 font-semibold text-gray-700">
                    {receiptFile
                      ? receiptFile.name
                      : 'Upload payment receipt'}
                  </span>

                  <span className="mt-1 text-xs text-gray-500">
                    JPG, PNG or WEBP — maximum 5 MB
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;

                      setReceiptError('');

                      if (file && !ALLOWED_TYPES.includes(file.type)) {
                        setReceiptFile(null);
                        event.target.value = '';
                        setReceiptError(
                          'Only JPG, PNG, or WEBP images are allowed.'
                        );
                        return;
                      }

                      if (file && file.size > MAX_FILE_SIZE) {
                        setReceiptFile(null);
                        event.target.value = '';
                        setReceiptError(
                          'The image must be 5 MB or smaller.'
                        );
                        return;
                      }

                      setReceiptFile(file);
                    }}
                  />
                </label>

                {receiptError && (
                  <p className="mt-2 text-sm text-red-600">
                    {receiptError}
                  </p>
                )}
              </div>
            </section>

            {/* Submit Error */}
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                !user ||
                paymentMutation.isPending ||
                profileLoading
              }
              className="w-full rounded-xl px-6 py-4 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
              }}
            >
              {paymentMutation.isPending
                ? 'Submitting Payment...'
                : 'Submit Payment'}
            </button>

            <p className="text-center text-xs leading-5 text-gray-400">
              Your course access will be activated only after payment verification.
            </p>
          </form>

          {/* Course Summary */}
          <aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="mt-5 aspect-video w-full rounded-xl object-cover"
                />
              )}

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                {course.title}
              </h3>

              {course.instructor_name && (
                <p className="mt-2 text-sm text-gray-500">
                  Instructor: {course.instructor_name}
                </p>
              )}

              <p className="mt-3 text-sm leading-6 text-gray-500">
                {course.description || 'Start learning with this course.'}
              </p>

              <div className="my-6 border-t border-gray-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-600">Total</span>

                <span
                  className="text-2xl font-bold"
                  style={{ color: secondary }}
                >
                  {formatPrice(course.price)}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Support Information */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h3 className="font-bold text-gray-900">
            Need Help?
          </h3>

          <p className="mt-2 text-sm leading-7 text-gray-600">
            If your course videos do not open quickly after your payment is
            approved, contact us through Facebook or Instagram, or open a
            support ticket on Discord and provide your code. Sometimes our
            email service reaches its daily sending limit, so you may not
            receive an email immediately.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={siteSettings.social.facebook}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:text-blue-600"
            >
              Facebook
            </a>

            <a
              href={siteSettings.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:text-pink-600"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
