
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  Fingerprint,
  Save,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from "lucide-react";

import { supabase } from "../supabase";
import { siteSettings } from "../siteSetting";

const theme = siteSettings.theme;

export default function AccountPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
  });

  const [message, setMessage] = useState("");

  // Get current user and profile
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["my-account"],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("You must be logged in.");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at, updated_at, email, phone_number")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      return {
        ...data,
        email: data.email || user.email,
      };
    },
  });

  // Fill form when profile is loaded
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
      });
    }
  }, [profile]);

  // Update profile
  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("You must be logged in.");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: updatedData.full_name.trim(),
          phone_number: updatedData.phone_number.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id, full_name, role, created_at, updated_at, email, phone_number")
        .single();

      if (error) throw error;

      return {
        ...data,
        email: data.email || user.email,
      };
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["my-account"], updatedProfile);
      setMessage("Your account information has been saved successfully.");
    },

    onError: (error) => {
      setMessage(error.message || "Something went wrong. Please try again.");
    },
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.full_name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    updateMutation.mutate(form);
  };

  const isChanged =
    profile &&
    (form.full_name !== (profile.full_name || "") ||
      form.phone_number !== (profile.phone_number || ""));

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    outline: "none",
    fontSize: "14px",
    background: "#fff",
    color: "#1f2937",
  };

  const readOnlyStyle = {
    ...inputStyle,
    background: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoaderCircle
          className="animate-spin"
          size={36}
          color={theme.primary}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <AlertCircle size={40} color="#dc2626" />
        <h2 className="text-xl font-bold">Unable to load your account</h2>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6"
      style={{ fontFamily: theme.fontSans }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p
            className="text-sm font-semibold tracking-widest uppercase mb-2"
            style={{ color: theme.primary }}
          >
            {siteSettings.name}
          </p>

          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: theme.fontDisplay }}
          >
            My Account
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your personal information and account details.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Profile Banner */}
          <div
            className="px-6 py-8 sm:px-8 flex flex-col sm:flex-row items-center gap-5"
            style={{
              background: `linear-gradient(120deg, ${theme.secondary}, ${theme.primary})`,
            }}
          >
            <div className="w-20 h-20 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              <User size={38} color="white" />
            </div>

            <div className="text-center sm:text-left text-white">
              <h2 className="text-2xl font-bold">
                {profile.full_name || "Welcome"}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {profile.email}
              </p>
              <span className="inline-flex mt-3 items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                <ShieldCheck size={14} />
                {profile.role || "User"}
              </span>
            </div>
          </div>

          {/* Account Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">

            <div className="flex items-center gap-2 mb-6">
              <Pencil size={19} color={theme.primary} />
              <h3 className="text-lg font-bold text-gray-900">
                Personal Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    style={{ ...inputStyle, paddingLeft: "46px" }}
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    style={{ ...inputStyle, paddingLeft: "46px" }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={profile.email || ""}
                    readOnly
                    style={{ ...readOnlyStyle, paddingLeft: "46px" }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Email is managed through your authentication settings.
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Role
                </label>
                <div className="relative">
                  <ShieldCheck
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={profile.role || "user"}
                    readOnly
                    style={{ ...readOnlyStyle, paddingLeft: "46px" }}
                  />
                </div>
              </div>

              {/* User ID */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  User ID
                </label>
                <div className="relative">
                  <Fingerprint
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={profile.id}
                    readOnly
                    style={{
                      ...readOnlyStyle,
                      paddingLeft: "46px",
                      fontSize: "12px",
                    }}
                  />
                </div>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Created
                </label>
                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={formatDate(profile.created_at)}
                    readOnly
                    style={{ ...readOnlyStyle, paddingLeft: "46px" }}
                  />
                </div>
              </div>

              {/* Updated At */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Updated
                </label>
                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={formatDate(profile.updated_at)}
                    readOnly
                    style={{ ...readOnlyStyle, paddingLeft: "46px" }}
                  />
                </div>
              </div>

            </div>

            {/* Message */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
                  updateMutation.isError
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {updateMutation.isError ? (
                  <AlertCircle size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {message}
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={!isChanged || updateMutation.isPending}
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ background: theme.primary }}
              >
                {updateMutation.isPending ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your account information is securely stored by {siteSettings.name}.
        </p>
      </div>
    </main>
  );
}
