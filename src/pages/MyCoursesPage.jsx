import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CourseCard } from '../components/course';
import { Button, EmptyState, Loader } from '../components/ui';
import { useMyCourses } from '../features/courses/courses.hooks';

const MyCoursesPage = () => {
  const { data: courses, isLoading, error } = useMyCourses();
  return <section><p className="text-sm font-bold text-[var(--color-accent)]">مساحتك التعليمية</p><h1 className="mt-2 font-display text-3xl font-bold">كورساتي</h1>{isLoading && <div className="py-12"><Loader /></div>}{error && <p className="mt-6 text-red-600">{error.message}</p>}{!isLoading && !error && (courses?.length ? <div className="mt-8 grid gap-6 md:grid-cols-2">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div> : <div className="mt-8"><EmptyState title="لم تُضف أي كورس بعد" description="تصفح الكورسات واختر ما يناسبك، ثم أرسل طلب الدفع." action={<Link to="/courses"><Button><BookOpen size={18} />تصفح الكورسات</Button></Link>} /></div>)}</section>;
};
export default MyCoursesPage;
