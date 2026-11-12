
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { siteSettings } from '../siteSetting';

export default function PaymentPage() {
  const navigate = useNavigate();

  const {
    data: courses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['paid-courses'],
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
          access_type
        `)
        .eq('status', 'published')
        .eq('access_type', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleBuy = (course) => {
    if (course.access_type !== 'paid' || Number(course.price) <= 0) {
      return;
    }

    navigate(`/checkout/${course.id}`);
  };

  const formatPrice = (price) =>
    `${Number(price || 0).toLocaleString('en-US')} EGP`;

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        fontFamily: siteSettings.theme.fontSans,
        '--primary': siteSettings.theme.primary,
        '--secondary': siteSettings.theme.secondary,
      }}
    >
      <section
        className="px-5 py-16 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${siteSettings.theme.primary}, ${siteSettings.theme.secondary})`,
        }}
      >
        <div className="mx-auto max-w-3xl">
          <img
            src={siteSettings.logo}
            alt={siteSettings.name}
            className="mx-auto mb-5 h-16 object-contain"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />

          <h1
            className="text-3xl font-bold sm:text-5xl"
            style={{ fontFamily: siteSettings.theme.fontDisplay }}
          >
            Explore Our Courses
          </h1>

          <p className="mt-4 text-sm text-white/85 sm:text-base">
            Discover your next skill and start learning with {siteSettings.name}.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Available Courses
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose the course that suits your goals.
            </p>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
            {courses.length} Courses
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-gray-500">
            Loading courses...
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            Unable to load courses. Please try again.
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-800">
              No courses available
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Please check again later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center text-3xl font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${siteSettings.theme.primary}, ${siteSettings.theme.secondary})`,
                      }}
                    >
                      {siteSettings.name}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl font-bold text-gray-900">
                    {course.title}
                  </h3>

                  {course.instructor_name && (
                    <p className="mt-2 text-sm text-gray-500">
                      Instructor: {course.instructor_name}
                    </p>
                  )}

                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">
                    {course.description || 'Start learning with this course.'}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                    <div>
                      <p className="text-xs text-gray-400">Course Price</p>
                      <p
                        className="mt-1 text-xl font-bold"
                        style={{ color: siteSettings.theme.secondary }}
                      >
                        {formatPrice(course.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuy(course)}
                      className="rounded-lg px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                      style={{
                        backgroundColor: siteSettings.theme.primary,
                      }}
                    >
                      BUY
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
