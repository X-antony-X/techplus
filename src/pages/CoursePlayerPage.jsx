
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  PlayCircle,
  LoaderCircle,
  AlertCircle,
  Video,
  Gauge,
} from 'lucide-react';

import { supabase } from '../supabase';
import { siteSettings } from '../siteSetting';

const CoursePlayerPage = () => {
  const extractGoogleDriveId = (url) => {
    if (!url) return '';

    try {
      const parsedUrl = new URL(url);

      const pathMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);

      if (pathMatch?.[1]) {
        return pathMatch[1];
      }

      const queryId = parsedUrl.searchParams.get('id');

      if (queryId) {
        return queryId;
      }

      return '';
    } catch {
      return '';
    }
  };

  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const { primary, secondary, fontSans, fontDisplay } =
    siteSettings.theme;

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLessonData = async () => {
      setLoading(true);
      setError('');

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          navigate('/login');
          return;
        }

        // Get course
        const { data: courseData, error: courseError } =
          await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .eq('status', 'published')
            .single();

        if (courseError) throw courseError;

        setCourse(courseData);

        // Get accessible lessons
        const { data: lessonsData, error: lessonsError } =
          await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;

        const availableLessons = lessonsData || [];

        setLessons(availableLessons);

        // Find current lesson
        const selectedLesson = availableLessons.find(
          (lesson) => lesson.id === lessonId
        );

        if (!selectedLesson) {
          throw new Error(
            'This lesson is unavailable or you do not have access to it.'
          );
        }

        setCurrentLesson(selectedLesson);
        setPlaybackRate(1);

      } catch (err) {
        console.error('Course player error:', err);
        setError(err.message || 'Unable to load lesson.');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [courseId, lessonId, navigate]);

  // Apply playback speed to native video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, currentLesson]);

  // Current lesson index
  const currentIndex = lessons.findIndex(
    (lesson) => lesson.id === lessonId
  );

  const previousLesson =
    currentIndex > 0 ? lessons[currentIndex - 1] : null;

  const nextLesson =
    currentIndex >= 0 && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  // Video type
  const isGoogleDrive =
    currentLesson?.video_provider === 'google_drive';

  const googleDriveId =
    currentLesson?.video_id ||
    extractGoogleDriveId(currentLesson?.video_url);

  const googleDriveUrl = googleDriveId
    ? `https://drive.google.com/file/d/${googleDriveId}/preview`
    : '';

  const directVideoUrl = !isGoogleDrive
    ? currentLesson?.video_url || ''
    : '';

  // Navigation
  const handlePrevious = () => {
    if (previousLesson) {
      navigate(
        `/courses/${courseId}/lessons/${previousLesson.id}`
      );
    }
  };

  const handleNext = () => {
    if (nextLesson) {
      navigate(
        `/courses/${courseId}/lessons/${nextLesson.id}`
      );
    }
  };

  // Loading
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
            Loading lesson...
          </p>
        </div>
      </main>
    );
  }

  // Error
  if (error || !course || !currentLesson) {
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
            Lesson Unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || 'This lesson could not be found.'}
          </p>

          <Link
            to={`/courses/${courseId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: primary }}
          >
            <ArrowLeft size={16} />
            Back to Course
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="ltr"
      lang="en"
      className="min-h-screen bg-[#F5F8FA] pb-12"
      style={{ fontFamily: fontSans }}
    >
      {/* Header */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${secondary}, ${primary})`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-9">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Course
          </Link>

          <h1
            className="mt-5 text-2xl font-extrabold text-white sm:text-3xl"
            style={{ fontFamily: fontDisplay }}
          >
            {course.title}
          </h1>

          <p className="mt-2 text-sm text-white/80">
            Lesson {currentIndex + 1} of {lessons.length}
          </p>
        </div>
      </section>

      {/* Player Content */}
      <section className="mx-auto max-w-6xl px-3 pt-6 sm:px-6 sm:pt-10">

        {/* Video Player */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md sm:rounded-2xl">

          {/* Responsive Video */}
          <div className="mx-auto w-full bg-black">
            <div className="relative aspect-video w-full overflow-hidden">

              {directVideoUrl ? (
                <video
                  ref={videoRef}
                  key={currentLesson.id}
                  src={directVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-contain"
                >
                  Your browser does not support video playback.
                </video>
              ) : isGoogleDrive && googleDriveUrl ? (
                <iframe
                  key={currentLesson.id}
                  src={googleDriveUrl}
                  title={currentLesson.title}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-5 text-center text-white">
                  <Video size={45} className="text-white/50" />

                  <p className="mt-4 text-lg font-bold">
                    Video unavailable
                  </p>

                  <p className="mt-2 text-sm text-white/50">
                    The video has not been added yet.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Video Information */}
          <div className="p-4 sm:p-7">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: primary }}
                >
                  Now Playing
                </p>

                <h2 className="mt-2 break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {currentLesson.title}
                </h2>
              </div>

              <span className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                <PlayCircle size={16} />
                Lesson {currentLesson.order_index}
              </span>
            </div>

            {currentLesson.description && (
              <p className="mt-4 text-sm leading-7 text-slate-500 sm:mt-5 sm:leading-8">
                {currentLesson.description}
              </p>
            )}

            {/* Playback Speed */}
            {directVideoUrl && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Gauge size={19} style={{ color: primary }} />
                  Playback Speed
                </div>

                <select
                  value={playbackRate}
                  onChange={(e) =>
                    setPlaybackRate(Number(e.target.value))
                  }
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x (Normal)</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={1.75}>1.75x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            )}

            {isGoogleDrive && (
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-400">
                Playback settings for this video are available inside the video player.
              </p>
            )}

          </div>
        </div>

        {/* Previous & Next Buttons */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-5">

          <button
            onClick={handlePrevious}
            disabled={!previousLesson}
            className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={18} />
            Previous Video
          </button>

          <button
            onClick={handleNext}
            disabled={!nextLesson}
            className="flex min-h-14 items-center justify-center gap-3 rounded-xl px-5 py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: primary }}
          >
            Next Video
            <ArrowRight size={18} />
          </button>

        </div>

        {/* Course Progress */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 sm:mt-8 sm:rounded-2xl sm:p-6">

          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${primary}15`,
                color: primary,
              }}
            >
              <BookOpen size={21} />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">
                Course Progress
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Lesson {currentIndex + 1} of {lessons.length}
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  lessons.length
                    ? ((currentIndex + 1) / lessons.length) * 100
                    : 0
                }%`,
                backgroundColor: primary,
              }}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-slate-200 pt-7 text-center">
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

export default CoursePlayerPage;
