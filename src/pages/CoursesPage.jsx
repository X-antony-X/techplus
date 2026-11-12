
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  BookOpen,
  Users,
  Clock3,
  ArrowUpRight,
  SlidersHorizontal,
  Sparkles,
  Code2,
  BrainCircuit,
  LayoutGrid,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react';

import { supabase } from '../supabase';
import { siteSettings } from '../siteSetting';

const getCategoryIcon = (category) => {
  const icons = {
    AI: BrainCircuit,
    'Web Development': Code2,
    Programming: BookOpen,
    Design: Sparkles,
  };

  return icons[category] || BookOpen;
};

const CoursesPage = () => {
  const { theme, name } = siteSettings;
  const { primary, secondary, accent, fontSans, fontDisplay } = theme;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Courses');
  const [sort, setSort] = useState('featured');

  // Fetch Courses from Supabase
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        setError('Unable to load courses. Please try again later.');
        setCourses([]);
      } else {
        setCourses(data || []);
      }

      setLoading(false);
    };

    fetchCourses();
  }, []);

  // Get Categories from Courses
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        courses
          .map((course) => course.category)
          .filter(Boolean)
      ),
    ];

    return [
      { name: 'All Courses', icon: LayoutGrid },
      ...uniqueCategories.map((category) => ({
        name: category,
        icon: getCategoryIcon(category),
      })),
    ];
  }, [courses]);

  // Search, Filter and Sort
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (activeCategory !== 'All Courses') {
      result = result.filter(
        (course) => course.category === activeCategory
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase();

      result = result.filter((course) =>
        [
          course.title,
          course.description,
          course.instructor_name,
          course.category,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }

    if (sort === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === 'popular') {
      result.sort(
        (a, b) =>
          Number(b.students_count || 0) -
          Number(a.students_count || 0)
      );
    }

    return result;
  }, [courses, search, activeCategory, sort]);

  return (
    <main
      dir="ltr"
      lang="en"
      className="min-h-screen bg-[#F5F8FA] pb-20"
      style={{
        fontFamily: fontSans,
        '--brand-primary': primary,
        '--brand-secondary': secondary,
      }}
    >
      {/* Hero Banner */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${secondary}, ${primary})`,
        }}
      >
        <div className="pointer-events-none absolute -left-20 -top-28 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -left-8 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-20 -bottom-48 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-[230px] max-w-7xl flex-col justify-center px-5 py-12 sm:px-8 lg:min-h-[270px]">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm">
            <Sparkles size={15} />
            LEARN SOMETHING NEW
          </div>

          <h1
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ fontFamily: fontDisplay }}
          >
            Explore the World of{' '}
            <span className="text-white/80">Technology.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-white/80 sm:text-base">
            Develop your skills, gain valuable experience, and take the
            next step toward a better future with our specialized courses.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative mx-auto -mt-7 max-w-7xl px-5 sm:px-8">

        {/* Search and Sort */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_40px_rgba(15,23,42,0.07)] md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for courses..."
              className="h-12 w-full rounded-xl bg-[#F5F8FA] pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--brand-primary)]/30"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[#F5F8FA] px-4 md:min-w-[210px]">
            <SlidersHorizontal size={18} className="text-slate-500" />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-12 w-full cursor-pointer bg-transparent text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="featured">Sort Courses</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none text-slate-400"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="mb-2 text-xs font-bold tracking-[0.18em]"
              style={{ color: primary }}
            >
              EXPLORE OUR COURSES
            </p>

            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              All Courses
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Choose your field and start building your future.
            </p>
          </div>

          <p className="text-sm font-medium text-slate-500">
            Showing{' '}
            <span className="font-bold text-slate-900">
              {filteredCourses.length}
            </span>{' '}
            courses
          </p>
        </div>

        {/* Category Filters */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.name;

            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className="flex shrink-0 items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-all duration-300"
                style={
                  isActive
                    ? {
                        backgroundColor: primary,
                        borderColor: primary,
                        color: accent,
                        boxShadow: `0 6px 18px ${primary}35`,
                      }
                    : {
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        color: '#64748B',
                      }
                }
              >
                <Icon size={16} />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <LoaderCircle
              size={42}
              className="animate-spin"
              style={{ color: primary }}
            />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading courses...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mt-10 rounded-2xl border border-red-100 bg-white px-5 py-16 text-center">
            <AlertCircle
              size={38}
              className="mx-auto text-red-400"
            />

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Something Went Wrong
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg px-5 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Course Cards */}
        {!loading && !error && (
          <>
            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <article
                  key={course.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
                >
                  {/* Image */}
                  <Link
                    to={`/courses/${course.id}`}
                    className="relative block aspect-[16/9] overflow-hidden bg-slate-100"
                  >
                    <img
                      src={
                        course.thumbnail_url ||
                        'https://placehold.co/900x500?text=TECH+PLUS'
                      }
                      alt={course.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

                    <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/50 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
                      {course.category || 'General'}
                    </span>

                    <span className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-white">
                      <BookOpen size={14} />
                      {course.lessons_count || 0} Lessons
                    </span>
                  </Link>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-bold"
                        style={{ color: primary }}
                      >
                        {course.level || 'All Levels'}
                      </span>

                      <span className="text-xs text-slate-400">
                        {course.instructor_name || 'TECH PLUS'}
                      </span>
                    </div>

                    <Link to={`/courses/${course.id}`}>
                      <h3 className="text-lg font-extrabold leading-8 text-slate-900 transition-colors group-hover:text-[var(--brand-secondary)]">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-7 text-slate-500">
                      {course.description}
                    </p>

                    <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Users size={15} />
                        {course.students_count || 0} Students
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock3 size={15} />
                        {course.duration || 'Not specified'}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <div>
                        <p className="text-[11px] text-slate-400">
                          Course Price
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-slate-900">
                          {Number(course.price || 0).toLocaleString('en-US')}
                          <span className="ml-1 text-xs font-semibold text-slate-500">
                            EGP
                          </span>
                        </p>
                      </div>

                      <Link
                        to={`/courses/${course.id}`}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white transition-all hover:brightness-110"
                        style={{
                          backgroundColor: primary,
                          boxShadow: `0 5px 15px ${primary}30`,
                        }}
                      >
                        View Details
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Empty State */}
            {filteredCourses.length === 0 && (
              <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
                <Search size={35} className="mx-auto text-slate-300" />

                <h3 className="mt-4 text-lg font-bold text-slate-800">
                  No Courses Found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try a different search term or select another category.
                </p>

                <button
                  onClick={() => {
                    setSearch('');
                    setActiveCategory('All Courses');
                  }}
                  className="mt-5 rounded-lg px-5 py-3 text-sm font-bold text-white"
                  style={{ backgroundColor: primary }}
                >
                  Show All Courses
                </button>
              </div>
            )}
          </>
        )}

        {/* Bottom Brand */}
        <div className="mt-16 border-t border-slate-200 pt-7 text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-slate-400">
            LEARN • BUILD • INNOVATE
          </p>

          <p
            className="mt-2 text-sm font-bold"
            style={{ color: secondary }}
          >
            {name}
          </p>
        </div>
      </section>
    </main>
  );
};

export default CoursesPage;
