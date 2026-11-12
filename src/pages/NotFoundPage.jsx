import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
const NotFoundPage = () => <div className="page-shell grid min-h-[60vh] place-items-center text-center"><div><p className="font-display text-8xl font-bold text-[var(--color-accent)]">404</p><h1 className="mt-3 font-display text-3xl font-bold">الصفحة غير موجودة</h1><Link to="/"><Button className="mt-6">العودة للرئيسية</Button></Link></div></div>;
export default NotFoundPage;
