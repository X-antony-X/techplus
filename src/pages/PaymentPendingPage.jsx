import { PaymentStatus } from '../components/payment';
import { EmptyState, Loader } from '../components/ui';
import { useMyPaymentRequests } from '../features/payments/payments.hooks';

const PaymentPendingPage = () => {
  const { data: requests, isLoading, error } = useMyPaymentRequests();
  return <section><p className="text-sm font-bold text-[var(--color-accent)]">حالة المراجعة</p><h1 className="mt-2 font-display text-3xl font-bold">طلبات الدفع</h1><p className="mt-3 text-sm text-black/60">سيظهر القبول أو الرفض هنا بعد أن يراجع الأدمن إثبات التحويل.</p>{isLoading && <div className="py-12"><Loader /></div>}{error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error.message}</p>}{!isLoading && !error && (requests?.length ? <div className="mt-7 space-y-4">{requests.map((request) => <PaymentStatus key={request.id} request={request} />)}</div> : <div className="mt-8"><EmptyState title="لا توجد طلبات دفع" description="عندما ترسل إثبات تحويل سيظهر هنا." /></div>)}</section>;
};
export default PaymentPendingPage;
