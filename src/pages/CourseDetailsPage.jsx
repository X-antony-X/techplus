
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Lock,
  PlayCircle,
  UserRound,
  AlertCircle,
  LoaderCircle,
  Clock3,
} from 'lucide-react';

import { supabase } from '../supabase';
import { siteSettings } from '../siteSetting';

const CourseDetailsPage = () => {
  const { id } = useParams();

  const { primary, secondary, fontSans, fontDisplay } =
    siteSettings.theme;

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      setError('');

      try {
        // 1. Get current user
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        setUser(currentUser || null);

        // 2. Get course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .eq('status', 'published')
          .single();

        if (courseError) throw courseError;

        setCourse(courseData);

        // 3. Determine access
        let admin = false;
        let fullAccess =
          courseData.access_type === 'free' ||
          Number(courseData.price || 0) <= 0;

        if (currentUser) {
          // Check user role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (profileError) throw profileError;

          admin = profile?.role === 'admin';

          // Check enrollment for paid courses
          if (
            courseData.access_type === 'paid' &&
            !admin
          ) {
            const { data: enrollment, error: enrollmentError } =
              await supabase
                .from('enrollments')
                .select('status, expires_at')
                .eq('user_id', currentUser.id)
                .eq('course_id', id)
                .eq('status', 'active')
                .maybeSingle();

            if (enrollmentError) throw enrollmentError;

            const isActive =
              enrollment?.status === 'active' &&
              (
                !enrollment.expires_at ||
                new Date(enrollment.expires_at) > new Date()
              );

            fullAccess = isActive;
          }

          if (admin) {
            fullAccess = true;
          }
        }

        setIsAdmin(admin);
        setHasFullAccess(fullAccess);

        // 4. Get ALL lesson information from the safe public view
        // This view does not expose video_url or video_id.
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('course_lessons_public')
          .select('*')
          .eq('course_id', id)
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;

        setLessons(lessonsData || []);

      } catch (err) {
        console.error('Course details error:', err);
        setError(err.message || 'Unable to load course details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  // Check if a lesson can be opened
  const canOpenLesson = (lesson) => {
    return hasFullAccess || lesson.is_preview === true;
  };

  if (loading) {
    return (
      <main
        className="flex min-h-[70vh] items-center justify-center"
        style={{ fontFamily: fontSans }}
      >
        <div className="text-center">
          <LoaderCircle
            size={42}
            className="mx-auto animate-spin"
            style={{ color: primary }}
          />

          <p className="mt-4 text-sm text-slate-500">
            Loading course...
          </p>
        </div>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main
        className="flex min-h-[70vh] items-center justify-center px-5"
        style={{ fontFamily: fontSans }}
      >
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <AlertCircle
            size={42}
            className="mx-auto text-red-400"
          />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Course Not Found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error || 'This course is unavailable.'}
          </p>

          <Link
            to="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: primary }}
          >
            <ArrowLeft size={16} />
            Back to Courses
          </Link>
        </div>
      </main>
    );
  }

  const lockedLessonsCount = lessons.filter(
    (lesson) => !canOpenLesson(lesson)
  ).length;

  const previewLessonsCount = lessons.filter(
    (lesson) => lesson.is_preview
  ).length;

  return (
    <main
      dir="ltr"
      lang="en"
      className="min-h-screen bg-[#F5F8FA] pb-16"
      style={{
        fontFamily: fontSans,
        '--brand-primary': primary,
        '--brand-secondary': secondary,
      }}
    >
      {/* Course Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${secondary}, ${primary})`,
        }}
      >
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/10" />

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
          <Link
            to="/courses"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Courses
          </Link>

          <div className="grid items-center gap-10 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">
                  {course.access_type === 'paid'
                    ? 'PAID COURSE'
                    : 'FREE COURSE'}
                </span>

                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">
                  {course.status}
                </span>
              </div>

              <h1
                className="text-3xl font-extrabold leading-tight text-white sm:text-5xl"
                style={{ fontFamily: fontDisplay }}
              >
                {course.title}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-white/80 sm:text-base">
                {course.description}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-6 text-sm text-white/90">
                <span className="flex items-center gap-2">
                  <UserRound size={17} />
                  {course.instructor_name}
                </span>

                <span className="flex items-center gap-2">
                  <BookOpen size={17} />
                  {lessons.length} Total Lessons
                </span>
              </div>
            </div>

            {course.thumbnail_url && (
              <div className="hidden overflow-hidden rounded-2xl border border-white/20 shadow-2xl lg:block">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">

          {/* Course Information */}
          <div className="min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2
                className="text-xl font-extrabold text-slate-900"
                style={{ fontFamily: fontDisplay }}
              >
                About This Course
              </h2>

              <p className="mt-4 text-sm leading-8 text-slate-600">
                {course.description}
              </p>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <div
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full"
                  style={{ backgroundColor: `${primary}15` }}
                >
                  {course.instructor_image_url ? (
                    <img
                      src={course.instructor_image_url}
                      alt={course.instructor_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <GraduationCap
                      size={23}
                      style={{ color: primary }}
                    />
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Course Instructor
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {course.instructor_name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons Sidebar */}
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Sidebar Header */}
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-extrabold text-slate-900">
                Course Content
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {lessons.length} total lessons
              </p>

              {hasFullAccess ? (
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-green-600">
                  <CheckCircle2 size={16} />
                  You have full course access
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-green-600">
                    <PlayCircle size={15} />
                    {previewLessonsCount} Preview
                  </span>

                  <span className="flex items-center gap-1.5 text-amber-600">
                    <Lock size={14} />
                    {lockedLessonsCount} Locked
                  </span>
                </div>
              )}
            </div>

            {/* Limited Access Message */}
            {!hasFullAccess && course.access_type === 'paid' && (
              <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
                  <Lock size={16} />
                  Limited Access
                </div>

                <p className="mt-2 text-xs leading-6 text-amber-700">
                  You can watch preview lessons. Contact the administration
                  to get full access to this course.
                </p>

                <p className="mt-3 text-lg font-extrabold text-slate-900">
                  {Number(course.price || 0).toLocaleString('en-US')} EGP
                </p>
              </div>
            )}

            {/* Lessons List */}
            {lessons.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {lessons.map((lesson) => {
                  const isAccessible = canOpenLesson(lesson);

                  const lessonContent = (
                    <>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isAccessible ? '' : 'bg-slate-100 text-slate-400'
                        }`}
                        style={
                          isAccessible
                            ? {
                                backgroundColor: `${primary}10`,
                                color: secondary,
                              }
                            : {}
                        }
                      >
                        {isAccessible ? (
                          <PlayCircle size={20} />
                        ) : (
                          <Lock size={19} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-bold ${
                            isAccessible
                              ? 'text-slate-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {lesson.title}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            Lesson {lesson.order_index}
                          </span>

                          {lesson.duration > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock3 size={11} />
                              {lesson.duration} min
                            </span>
                          )}

                          {lesson.is_preview && (
                            <span
                              className="rounded px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                backgroundColor: `${primary}15`,
                                color: secondary,
                              }}
                            >
                              Preview
                            </span>
                          )}

                          {!isAccessible && (
                            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Full Access Required
                            </span>
                          )}
                        </div>
                      </div>

                      {isAccessible ? (
                        <PlayCircle
                          size={17}
                          className="shrink-0"
                          style={{ color: primary }}
                        />
                      ) : (
                        <Lock
                          size={16}
                          className="shrink-0 text-slate-400"
                        />
                      )}
                    </>
                  );

                  return isAccessible ? (
                    <Link
                      key={lesson.id}
                      to={`/courses/${id}/lessons/${lesson.id}`}
                      className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
                    >
                      {lessonContent}
                    </Link>
                  ) : (
                    <div
                      key={lesson.id}
                      aria-disabled="true"
                      className="flex w-full cursor-not-allowed items-center gap-3 bg-slate-50/50 p-4 text-left"
                    >
                      {lessonContent}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-7 text-center">
                <BookOpen
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-bold text-slate-700">
                  No lessons added yet
                </p>

                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Lessons will appear here once they are added.
                </p>
              </div>
            )}

            {/* Sign In Message */}
            {!user && course.access_type === 'paid' && (
              <div className="border-t border-slate-100 p-4">
                <p className="mb-3 text-center text-xs text-slate-500">
                  Sign in to check your course access.
                </p>

                <Link
                  to="/login"
                  className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white"
                  style={{ backgroundColor: primary }}
                >
                  Sign In
                </Link>
              </div>
            )}
          </aside>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-slate-200 pt-7 text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-slate-400">
            LEARN • BUILD • INNOVATE
          </p>

          <p
            className="mt-2 text-sm font-bold"
            style={{ color: secondary }}
          >
            {siteSettings.name}
          </p>
        </div>
      </section>
    </main>
  );
};

export default CourseDetailsPage;
