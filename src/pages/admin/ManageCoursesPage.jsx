
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Image,
  UserRound,
  RefreshCw,
  ArrowUpDown,
  Eye,
  AlertCircle,
} from 'lucide-react';

import { supabase } from '../../supabase';
import { siteSettings } from '../../siteSetting';

function ManageCoursesPage() {
  const primary = siteSettings.theme.primary;

  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);

  const initialForm = {
    title: '',
    description: '',
    price: '',
    thumbnail_url: '',
    instructor_name: '',
    instructor_image_url: '',
    status: 'draft',
    access_type: 'paid',
  };

  const [form, setForm] = useState(initialForm);

  const isAdmin = userRole === 'admin';
  const isInstructor = ['teacher', 'lecturer'].includes(userRole);

  // Get current user and profile role
  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!currentUser) {
          if (mounted) {
            setError('Please login first.');
            setLoading(false);
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (profileError) throw profileError;

        if (mounted) {
          setUser(currentUser);
          setUserRole(profile.role);
        }
      } catch (err) {
        console.error('Profile error:', err);
        if (mounted) {
          setError(err.message || 'Unable to load your profile.');
          setLoading(false);
        }
      }
    };

    getUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCourses(data || []);
    } catch (err) {
      console.error('Courses error:', err);
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userRole) {
      fetchCourses();
    }
  }, [user, userRole]);

  // Search and sort
  const filteredCourses = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    let result = courses.filter((course) => {
      return (
        course.id?.toLowerCase().includes(searchValue) ||
        course.title?.toLowerCase().includes(searchValue) ||
        course.description?.toLowerCase().includes(searchValue) ||
        course.instructor_name?.toLowerCase().includes(searchValue)
      );
    });

    result = [...result];

    if (sortBy === 'newest') {
      result.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    } else if (sortBy === 'oldest') {
      result.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [courses, search, sortBy]);

  // Open add modal
  const handleAdd = () => {
    setEditingCourse(null);
    setForm(initialForm);
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (course) => {
    setEditingCourse(course);

    setForm({
      title: course.title || '',
      description: course.description || '',
      price: course.price ?? '',
      thumbnail_url: course.thumbnail_url || '',
      instructor_name: course.instructor_name || '',
      instructor_image_url: course.instructor_image_url || '',
      status: course.status || 'draft',
      access_type: course.access_type || 'paid',
    });

    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === 'access_type') {
        return {
          ...prev,
          access_type: value,
          price: value === 'free' ? '' : '',
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  // Save course
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be logged in.');
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError('Please enter the course title and description.');
      return;
    }

    if (form.access_type === 'paid') {
      if (
        form.price === '' ||
        !Number.isFinite(Number(form.price)) ||
        Number(form.price) <= 0
      ) {
        setError('Please enter a valid price greater than zero for paid courses.');
        return;
      }
    }

    if (!form.instructor_name.trim()) {
      setError('Please enter the instructor name.');
      return;
    }

    setSaving(true);

    try {
      const courseData = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.access_type === 'free' ? 0 : Number(form.price),
        thumbnail_url: form.thumbnail_url.trim() || null,
        instructor_name: form.instructor_name.trim(),
        instructor_image_url: form.instructor_image_url.trim() || null,
        status: form.status.trim(),
        access_type: form.access_type.trim(),
        updated_at: new Date().toISOString(),
      };

      if (editingCourse) {
        // Admin can edit any course.
        // Teacher / Lecturer can edit their own courses only.
        const { error: updateError } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (updateError) throw updateError;

        setSuccess('Course updated successfully!');
      } else {
        // New courses belong to the logged-in user.
        const { error: insertError } = await supabase
          .from('courses')
          .insert({
            ...courseData,
            created_by: user.id,
          });

        if (insertError) throw insertError;

        setSuccess('Course created successfully!');
      }

      setIsModalOpen(false);
      setEditingCourse(null);
      setForm(initialForm);

      await fetchCourses();
    } catch (err) {
      console.error('Save course error:', err);
      setError(err.message || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Delete course
  const handleDelete = async () => {
    if (!deletingCourse) return;

    setSaving(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', deletingCourse.id);

      if (deleteError) throw deleteError;

      setDeletingCourse(null);
      setSuccess('Course deleted successfully!');

      await fetchCourses();
    } catch (err) {
      console.error('Delete course error:', err);
      setError(
        err.message ||
        'Unable to delete this course. It may have related lessons or payments.'
      );
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingCourse(null);
    setForm(initialForm);
  };

  const formatDate = (date) => {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Loading screen
  if (loading && !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#101010]">
        <RefreshCw
          className="animate-spin"
          size={32}
          style={{ color: primary }}
        />
      </div>
    );
  }

  if (!isAdmin && !isInstructor && !loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#101010] px-4 text-center">
        <div>
          <AlertCircle size={45} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="mt-2 text-gray-400">
            You don't have permission to manage courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101010] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BookOpen size={20} style={{ color: primary }} />
              <span
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: primary }}
              >
                Course Management
              </span>
            </div>

            <h1
              className="text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: siteSettings.theme.fontDisplay }}
            >
              Manage Courses
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Create, edit, and manage your courses.
            </p>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <Plus size={19} />
            Add New Course
          </button>
        </div>

        {/* Notifications */}
        {error && !isModalOpen && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle size={19} />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            <span>{success}</span>
            <button
              onClick={() => setSuccess('')}
              className="ml-auto"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#181818] p-5">
            <p className="text-sm text-gray-400">Total Courses Visible</p>
            <h3 className="mt-2 text-3xl font-bold">{courses.length}</h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#181818] p-5">
            <p className="text-sm text-gray-400">Published</p>
            <h3 className="mt-2 text-3xl font-bold text-green-400">
              {courses.filter((c) => c.status === 'published').length}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#181818] p-5">
            <p className="text-sm text-gray-400">Drafts</p>
            <h3 className="mt-2 text-3xl font-bold text-yellow-400">
              {courses.filter((c) => c.status === 'draft').length}
            </h3>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, description, instructor..."
              className="w-full rounded-xl border border-white/10 bg-[#181818] py-3 pl-12 pr-4 text-sm text-white outline-none transition focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#181818] px-3">
            <ArrowUpDown size={17} className="text-gray-500" />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent py-3 text-sm text-gray-300 outline-none sm:w-44"
            >
              <option className="bg-[#181818]" value="newest">Newest First</option>
              <option className="bg-[#181818]" value="oldest">Oldest First</option>
              <option className="bg-[#181818]" value="title">Title A-Z</option>
              <option className="bg-[#181818]" value="price-low">Price: Low to High</option>
              <option className="bg-[#181818]" value="price-high">Price: High to Low</option>
            </select>
          </div>

          <button
            onClick={fetchCourses}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Courses Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#181818]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="font-bold">All Courses</h2>
            <span className="text-xs text-gray-500">
              {filteredCourses.length} results
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <RefreshCw
                size={28}
                className="animate-spin"
                style={{ color: primary }}
              />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <BookOpen size={40} className="mx-auto mb-3 text-gray-600" />
              <h3 className="font-semibold text-gray-300">
                No courses found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {search
                  ? 'Try another search term.'
                  : 'Start by adding your first course.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Instructor</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Access</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      {/* Course */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="h-12 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-white/5">
                              <Image size={20} className="text-gray-500" />
                            </div>
                          )}

                          <div className="max-w-[230px]">
                            <p className="truncate text-sm font-semibold text-white">
                              {course.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              ID: {course.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Instructor */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {course.instructor_image_url ? (
                            <img
                              src={course.instructor_image_url}
                              alt={course.instructor_name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                              <UserRound size={16} className="text-gray-400" />
                            </div>
                          )}

                          <span className="text-sm text-gray-300">
                            {course.instructor_name}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 text-sm font-semibold">
                        {course.access_type === 'free' ? (
                          <span className="font-semibold text-green-400">Free</span>
                        ) : (
                          <span>
                            {Number(course.price).toLocaleString('en-US')} EGP
                          </span>
                        )}
                      </td>

                      {/* Access */}
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                          {course.access_type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            course.status === 'published'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {formatDate(course.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(course)}
                            title="Edit course"
                            className="rounded-lg border border-white/10 p-2 text-gray-300 transition hover:border-white/30 hover:text-white"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => setDeletingCourse(course)}
                            title="Delete course"
                            className="rounded-lg border border-red-500/20 p-2 text-red-400 transition hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the course information below.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Course Title *
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter course title"
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm outline-none focus:border-white/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe your course..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm outline-none focus:border-white/30"
                />
              </div>

              {/* Price and Instructor */}
              <div
                className={`grid gap-4 ${
                  form.access_type === 'paid'
                    ? 'sm:grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {form.access_type === 'paid' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Price *
                    </label>

                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Enter course price"
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Instructor Name *
                  </label>

                  <input
                    name="instructor_name"
                    value={form.instructor_name}
                    onChange={handleChange}
                    required
                    placeholder="Instructor name"
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Course Thumbnail URL
                </label>
                <input
                  type="url"
                  name="thumbnail_url"
                  value={form.thumbnail_url}
                  onChange={handleChange}
                  placeholder="https://example.com/course-image.jpg"
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm outline-none focus:border-white/30"
                />

                {form.thumbnail_url && (
                  <img
                    src={form.thumbnail_url}
                    alt="Course preview"
                    className="mt-3 h-32 w-full rounded-xl object-cover"
                  />
                )}
              </div>

              {/* Instructor Image */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Instructor Image URL
                </label>
                <input
                  type="url"
                  name="instructor_image_url"
                  value={form.instructor_image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/instructor.jpg"
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm outline-none focus:border-white/30"
                />

                {form.instructor_image_url && (
                  <img
                    src={form.instructor_image_url}
                    alt="Instructor preview"
                    className="mt-3 h-20 w-20 rounded-full object-cover"
                  />
                )}
              </div>

              {/* Status and Access Type */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm outline-none focus:border-white/30"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Access Type
                  </label>
                  <select
                    name="access_type"
                    value={form.access_type}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm outline-none focus:border-white/30"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: primary }}
                >
                  {saving && (
                    <RefreshCw size={17} className="animate-spin" />
                  )}
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingCourse && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <Trash2 size={23} />
            </div>

            <h2 className="text-xl font-bold">Delete Course?</h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Are you sure you want to delete
              <span className="font-semibold text-white">
                {' '}{deletingCourse.title}
              </span>
              ? This action cannot be undone.
            </p>

            <p className="mt-2 text-xs text-yellow-400">
              Deletion may fail if this course has related lessons,
              enrollments, or payments.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingCourse(null)}
                disabled={saving}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {saving && (
                  <RefreshCw size={16} className="animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageCoursesPage;
