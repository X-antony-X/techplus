
import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Video,
  Pencil,
  Trash2,
  X,
  Save,
  LoaderCircle,
  AlertCircle,
  BookOpen,
  Lock,
  PlayCircle,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

import { supabase } from '../../supabase';
import { siteSettings } from '../../siteSetting';

const emptyForm = {
  course_id: '',
  title: '',
  description: '',
  video_url: '',
  is_preview: false,
};

const ManageLessonsPage = () => {
  const { primary, secondary, fontSans, fontDisplay } =
    siteSettings.theme;

  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [sort, setSort] = useState('newest');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [deletingLesson, setDeletingLesson] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [coursesResult, lessonsResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, status, access_type')
          .order('created_at', { ascending: false }),

        supabase
          .from('lessons')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (coursesResult.error) throw coursesResult.error;
      if (lessonsResult.error) throw lessonsResult.error;

      setCourses(coursesResult.data || []);
      setLessons(lessonsResult.data || []);
    } catch (err) {
      console.error('Manage lessons fetch error:', err);
      setError(err.message || 'Unable to load lessons.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const getCourseName = (courseId) => {
    const course = courses.find((item) => item.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const selectedCourseData = courses.find(
    (course) => course.id === form.course_id
  );

  const isPaidCourse =
    selectedCourseData?.access_type === 'paid';

  const filteredLessons = useMemo(() => {
    let result = [...lessons];

    if (selectedCourse !== 'all') {
      result = result.filter(
        (lesson) => lesson.course_id === selectedCourse
      );
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();

      result = result.filter((lesson) => {
        const courseName =
          courses.find((course) => course.id === lesson.course_id)
            ?.title || '';

        return [
          lesson.id,
          lesson.title,
          lesson.description,
          courseName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term);
      });
    }

    if (sort === 'newest') {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    } else if (sort === 'oldest') {
      result.sort(
        (a, b) =>
          new Date(a.created_at || 0) -
          new Date(b.created_at || 0)
      );
    } else if (sort === 'title') {
      result.sort((a, b) =>
        (a.title || '').localeCompare(b.title || '')
      );
    } else if (sort === 'order') {
      result.sort(
        (a, b) =>
          Number(a.order_index || 0) -
          Number(b.order_index || 0)
      );
    }

    return result;
  }, [lessons, search, selectedCourse, sort, courses]);

  const openAddModal = () => {
    setEditingLesson(null);
    setForm({
      ...emptyForm,
      course_id: courses[0]?.id || '',
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);

    setForm({
      course_id: lesson.course_id || '',
      title: lesson.title || '',
      description: lesson.description || '',
      video_url: lesson.video_url || '',
      is_preview: lesson.is_preview === true,
    });

    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingLesson(null);
    setForm(emptyForm);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const getNextOrder = (courseId) => {
    const courseLessons = lessons.filter(
      (lesson) => lesson.course_id === courseId
    );

    if (courseLessons.length === 0) return 1;

    return (
      Math.max(
        ...courseLessons.map((lesson) =>
          Number(lesson.order_index || 0)
        )
      ) + 1
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!form.course_id) {
      setError('Please select a course.');
      return;
    }

    if (!form.title.trim()) {
      setError('Please enter the lesson title.');
      return;
    }

    if (!form.video_url.trim()) {
      setError('Please enter the Google Drive video link.');
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(form.video_url.trim());
    } catch {
      setError('Please enter a valid video URL.');
      return;
    }

    if (
      parsedUrl.protocol !== 'https:' ||
      !(
        parsedUrl.hostname === 'drive.google.com' ||
        parsedUrl.hostname.endsWith('.drive.google.com')
      )
    ) {
      setError(
        'Please enter a valid Google Drive sharing link starting with https://drive.google.com/'
      );
      return;
    }

    setSaving(true);

    try {
      const course = courses.find(
        (item) => item.id === form.course_id
      );

      const isPaid = course?.access_type === 'paid';

      const lessonData = {
        course_id: form.course_id,
        title: form.title.trim(),
        description: form.description.trim() || null,

        // This is the only video provider used by this project.
        video_provider: 'google_drive',

        // The Google Drive link is saved directly.
        video_url: form.video_url.trim(),

        // No separate video ID is needed for this form.
        video_id: null,

        // Duration is not collected from the form.
        duration: 0,

        // Automatically assign lesson order within its course.
        order_index: editingLesson
          ? Number(editingLesson.order_index || 1)
          : getNextOrder(form.course_id),

        // Preview toggle is relevant only to paid courses.
        is_preview: isPaid ? Boolean(form.is_preview) : false,

        updated_at: new Date().toISOString(),
      };

      let result;

      if (editingLesson) {
        result = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id)
          .select('*')
          .maybeSingle();
      } else {
        result = await supabase
          .from('lessons')
          .insert([lessonData])
          .select('*')
          .single();
      }

      if (result.error) throw result.error;

      if (!result.data) {
        throw new Error(
          'No lesson was saved. Check your Supabase RLS permissions.'
        );
      }

      setSuccess(
        editingLesson
          ? 'Lesson updated successfully.'
          : 'Lesson added successfully.'
      );

      setIsModalOpen(false);
      setEditingLesson(null);
      setForm(emptyForm);

      await fetchData();
    } catch (err) {
      console.error('Save lesson error:', err);
      setError(err.message || 'Unable to save lesson.');
    } finally {
      setSaving(false);
    }
  };

const handleDelete = async () => {
  if (!deletingLesson) return;

  setDeleteLoading(true);
  setError('');
  setSuccess('');

  try {
    const { error: deleteError, count } = await supabase
      .from('lessons')
      .delete({ count: 'exact' })
      .eq('id', deletingLesson.id);

    console.log('Lesson ID:', deletingLesson.id);
    console.log('Delete error:', deleteError);
    console.log('Deleted rows:', count);

    if (deleteError) {
      throw deleteError;
    }

    if (count === 0) {
      throw new Error('No lesson was deleted. Check DELETE permissions.');
    }

    setSuccess('Lesson deleted successfully.');
    setDeletingLesson(null);

    await fetchData();
  } catch (err) {
    console.error('Delete lesson error:', err);
    setError(err.message || 'Unable to delete lesson.');
  } finally {
    setDeleteLoading(false);
  }
};

  const formatDate = (date) => {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10';

  const labelClass =
    'mb-2 block text-xs font-bold text-slate-600';

  return (
    <main
      dir="ltr"
      className="min-h-screen bg-[#F5F8FA] px-4 py-8 sm:px-6 lg:px-8"
      style={{
        fontFamily: fontSans,
        '--brand-primary': primary,
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div
              className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.18em]"
              style={{ color: primary }}
            >
              <Video size={15} />
              CONTENT MANAGEMENT
            </div>

            <h1
              className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
              style={{ fontFamily: fontDisplay }}
            >
              Manage Lessons
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Add, edit and manage your course lessons.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              disabled={courses.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: primary,
                boxShadow: `0 5px 18px ${primary}30`,
              }}
            >
              <Plus size={18} />
              Add New Lesson
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && !isModalOpen && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="ml-auto"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            <CheckCircle2 size={18} />
            {success}
            <button
              type="button"
              onClick={() => setSuccess('')}
              className="ml-auto"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Total Lessons
              </p>
              <Video size={20} style={{ color: primary }} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {lessons.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Preview Lessons
              </p>
              <PlayCircle size={20} className="text-green-600" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {lessons.filter((lesson) => lesson.is_preview === true).length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Courses
              </p>
              <BookOpen size={20} style={{ color: secondary }} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {courses.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px_210px]">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by lesson title or course..."
                className={`${inputClass} h-12 pl-11`}
              />
            </div>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className={`${inputClass} h-12`}
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <div className="relative">
              <ArrowUpDown
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`${inputClass} h-12 pl-10`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="order">Lesson Order</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Showing {filteredLessons.length} of {lessons.length} lessons
            </span>

            {(search || selectedCourse !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCourse('all');
                }}
                className="font-bold text-slate-600 hover:text-slate-900"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Lessons Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-extrabold text-slate-900">
                Lessons Database
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Manage your uploaded course lessons.
              </p>
            </div>

            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              {filteredLessons.length} Records
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <LoaderCircle
                size={38}
                className="animate-spin"
                style={{ color: primary }}
              />
              <p className="mt-4 text-sm text-slate-500">
                Loading lessons...
              </p>
            </div>
          ) : error && lessons.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <AlertCircle
                size={35}
                className="mx-auto text-red-400"
              />
              <p className="mt-3 font-bold text-slate-800">
                Unable to load lessons
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Check your Supabase permissions and try again.
              </p>
              <button
                type="button"
                onClick={fetchData}
                className="mt-5 rounded-xl px-5 py-3 text-sm font-bold text-white"
                style={{ backgroundColor: primary }}
              >
                Try Again
              </button>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Video
                size={38}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 font-bold text-slate-800">
                No Lessons Found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try changing your filters or add a new lesson.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Lesson</th>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Order</th>
                    <th className="px-5 py-4">Access</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${primary}12`,
                              color: primary,
                            }}
                          >
                            <Video size={19} />
                          </div>

                          <div className="max-w-[240px]">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {lesson.title}
                            </p>
                            <p
                              className="mt-1 truncate text-[10px] text-slate-400"
                              title={lesson.id}
                            >
                              ID: {lesson.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[190px] truncate text-sm font-semibold text-slate-700">
                          {getCourseName(lesson.course_id)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-700">
                          {lesson.order_index}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {lesson.is_preview === true ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-bold text-green-700">
                            <PlayCircle size={13} />
                            Preview
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
                            <Lock size={13} />
                            Locked
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(lesson.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {lesson.video_url && (
                            <a
                              href={lesson.video_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open Google Drive link"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(lesson)}
                            title="Edit lesson"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingLesson(lesson)}
                            title="Delete lesson"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
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

        <p className="mt-6 text-center text-xs text-slate-400">
          {siteSettings.name} • Lessons Management
        </p>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div
              className="flex items-center justify-between px-6 py-5 text-white"
              style={{
                background: `linear-gradient(120deg, ${secondary}, ${primary})`,
              }}
            >
              <div>
                <h2 className="text-xl font-extrabold">
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </h2>
                <p className="mt-1 text-xs text-white/75">
                  Enter the lesson information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Course */}
                <div>
                  <label className={labelClass}>
                    Select Course *
                  </label>
                  <select
                    name="course_id"
                    value={form.course_id}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Choose a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                        {course.status !== 'published'
                          ? ` (${course.status})`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lesson Title */}
                <div>
                  <label className={labelClass}>
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Introduction to Artificial Intelligence"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>
                    Lesson Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Write a short description about this lesson..."
                    className={`${inputClass} resize-y`}
                  />
                </div>

                {/* Google Drive Link */}
                <div>
                  <label className={labelClass}>
                    Google Drive Video Link *
                  </label>
                  <input
                    type="url"
                    name="video_url"
                    value={form.video_url}
                    onChange={handleChange}
                    placeholder="https://drive.google.com/file/d/..."
                    required
                    className={inputClass}
                  />
                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    Paste the sharing link of your video from Google Drive.
                    Make sure the video sharing permissions allow the intended
                    students to view it.
                  </p>
                </div>

                {/* Preview Toggle: Paid Courses Only */}
                {isPaidCourse ? (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-green-300 hover:bg-green-50/40">
                    <input
                      type="checkbox"
                      name="is_preview"
                      checked={form.is_preview}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 cursor-pointer accent-green-600"
                    />

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Make this a Free Preview Lesson
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Students can watch this lesson without purchasing
                        the course.
                      </p>
                      <p className="mt-2 text-xs font-bold text-green-700">
                        {form.is_preview
                          ? 'Preview enabled'
                          : 'This lesson will be locked'}
                      </p>
                    </div>
                  </label>
                ) : form.course_id ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-bold text-blue-800">
                      Free Course
                    </p>
                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      This course is free, so students with access to the
                      course can watch its lessons.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                  style={{ backgroundColor: primary }}
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? 'Saving...'
                    : editingLesson
                      ? 'Save Changes'
                      : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingLesson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Trash2 size={25} />
            </div>

            <h2 className="mt-5 text-center text-xl font-extrabold text-slate-900">
              Delete Lesson?
            </h2>

            <p className="mt-3 text-center text-sm leading-7 text-slate-500">
              Are you sure you want to delete{' '}
              <strong className="text-slate-800">
                {deletingLesson.title}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingLesson(null)}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {deleteLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ManageLessonsPage;
