
import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Eye,
  X,
  ExternalLink,
  GraduationCap,
  User,
  Mail,
  Phone,
  CalendarDays,
  Image as ImageIcon,
} from 'lucide-react';

import { supabase } from '../../supabase';
import { siteSettings } from '../../siteSetting';

const PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Approved' },
  { value: 'failed', label: 'Rejected' },
];

function formatPrice(amount) {
  return `${Number(amount || 0).toLocaleString('en-US')} EGP`;
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatus(status) {
  const statuses = {
    pending: {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    paid: {
      label: 'Approved',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    failed: {
      label: 'Rejected',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
    },
  };

  return statuses[status] || {
    label: status || 'Unknown',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Clock,
  };
}

function StatusBadge({ status }) {
  const config = getStatus(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${config.className}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}

export default function PaymentRequestsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionError, setActionError] = useState('');

  const { primary, secondary, fontSans, fontDisplay } =
    siteSettings.theme;

  // Fetch payment requests
  const {
    data: payments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-payment-requests'],

    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          user_id,
          course_id,
          payment_method,
          status,
          created_at,
          updated_at,
          full_name,
          email,
          phone_number,
          sender_phone,
          amount,
          receipt_url,
          course:courses (
            id,
            title,
            thumbnail_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      // Generate temporary URLs for private receipts
      const paymentsWithReceipts = await Promise.all(
        (data || []).map(async (payment) => {
          if (!payment.receipt_url) {
            return {
              ...payment,
              receiptSignedUrl: null,
            };
          }

          const { data: signedData, error: signedError } =
            await supabase.storage
              .from('payment-receipts')
              .createSignedUrl(payment.receipt_url, 3600);

          if (signedError) {
            console.error(
              'Receipt URL error:',
              payment.id,
              signedError
            );

            return {
              ...payment,
              receiptSignedUrl: null,
            };
          }

          return {
            ...payment,
            receiptSignedUrl: signedData?.signedUrl || null,
          };
        })
      );

      return paymentsWithReceipts;
    },

    staleTime: 30 * 1000,
  });

  // Approve or reject payment
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, status }) => {
      // APPROVE:
      // Update payment to paid AND activate course enrollment
      // Both operations happen inside the Supabase database function.
      if (status === 'paid') {
        const { error } = await supabase.rpc(
          'approve_payment_and_enroll',
          {
            p_payment_id: paymentId,
          }
        );

        if (error) throw error;

        return {
          id: paymentId,
          status: 'paid',
        };
      }

      // REJECT:
      // Only update payment status
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;

      return data;
    },

    onSuccess: async () => {
      setActionError('');
      setSelectedPayment(null);

      // Refresh payment requests and related cached data
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['admin-payment-requests'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['my-enrollments'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['course-access'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['courses'],
        }),
      ]);
    },

    onError: (error) => {
      console.error('Payment action error:', error);

      setActionError(
        error.message || 'Unable to update this payment request.'
      );
    },
  });

  // Search and filter
  const filteredPayments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === 'all' || payment.status === statusFilter;

      const searchableText = [
        payment.full_name,
        payment.email,
        payment.phone_number,
        payment.sender_phone,
        payment.course?.title,
        payment.payment_method,
        payment.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [payments, search, statusFilter]);

  // Statistics
  const stats = useMemo(() => ({
    total: payments.length,
    pending: payments.filter(
      (item) => item.status === 'pending'
    ).length,
    approved: payments.filter(
      (item) => item.status === 'paid'
    ).length,
    rejected: payments.filter(
      (item) => item.status === 'failed'
    ).length,
  }), [payments]);

  // Handle approve / reject
  const handlePaymentAction = (payment, status) => {
    const action = status === 'paid' ? 'approve' : 'reject';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this payment request?`
    );

    if (!confirmed) return;

    setActionError('');

    updatePaymentMutation.mutate({
      paymentId: payment.id,
      status,
    });
  };

  const openDetails = (payment) => {
    setActionError('');
    setSelectedPayment(payment);
  };

  const statCards = [
    {
      label: 'Total Requests',
      value: stats.total,
      icon: Wallet,
      color: 'text-slate-700',
      background: 'bg-slate-100',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-700',
      background: 'bg-amber-50',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      background: 'bg-emerald-50',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-700',
      background: 'bg-red-50',
    },
  ];

  return (
    <main
      className="min-h-screen bg-slate-50 px-3 py-7 sm:px-6 sm:py-10 lg:px-10"
      style={{
        fontFamily: fontSans,
        '--primary': primary,
        '--secondary': secondary,
      }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div
              className="mb-3 flex items-center gap-2 text-sm font-semibold"
              style={{ color: secondary }}
            >
              <GraduationCap size={19} />
              {siteSettings.name} / ADMIN
            </div>

            <h1
              className="text-2xl font-bold text-slate-900 sm:text-3xl"
              style={{ fontFamily: fontDisplay }}
            >
              Payment Requests
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review customer transactions and manage course payments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={isFetching ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    {stat.label}
                  </p>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.background} ${stat.color}`}
                  >
                    <Icon size={18} />
                  </div>
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone, course..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className="rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm"
                  style={
                    statusFilter === option.value
                      ? {
                          backgroundColor: primary,
                          color: '#FFFFFF',
                        }
                      : {
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                        }
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Error */}
        {actionError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin"
              style={{ color: primary }}
            />
            <p className="mt-4 text-sm text-slate-500">
              Loading payment requests...
            </p>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <XCircle size={32} className="mx-auto text-red-500" />

            <h2 className="mt-3 font-bold text-slate-900">
              Unable to load payment requests
            </h2>

            <p className="mt-2 break-words text-sm text-slate-500">
              {error?.message || 'Something went wrong.'}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filteredPayments.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
            <Wallet size={35} className="mx-auto text-slate-300" />

            <h2 className="mt-4 font-bold text-slate-800">
              No payment requests found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {payments.length === 0
                ? 'New payment requests will appear here.'
                : 'Try changing your search or status filter.'}
            </p>
          </div>
        )}

        {/* Payments Table and Cards */}
        {!isLoading && !isError && filteredPayments.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Course</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {payment.full_name || '—'}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {payment.email || '—'}
                          </p>
                        </td>

                        <td className="max-w-[200px] px-5 py-4">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {payment.course?.title || 'Course unavailable'}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-800">
                          {formatPrice(payment.amount)}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {payment.payment_method}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {payment.sender_phone || '—'}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {formatDate(payment.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={payment.status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openDetails(payment)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-slate-100"
                            style={{ color: secondary }}
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
              {filteredPayments.map((payment) => (
                <article
                  key={payment.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">
                        {payment.full_name || 'Unknown customer'}
                      </h3>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {payment.email || '—'}
                      </p>
                    </div>

                    <StatusBadge status={payment.status} />
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Course</p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {payment.course?.title || 'Course unavailable'}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">
                        Amount
                      </span>

                      <span
                        className="font-bold"
                        style={{ color: secondary }}
                      >
                        {formatPrice(payment.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{payment.payment_method}</span>
                    <span>{formatDate(payment.created_at)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDetails(payment)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: primary }}
                  >
                    <Eye size={16} />
                    View Full Details
                  </button>
                </article>
              ))}
            </div>
          </>
        )}

        <p className="mt-5 text-center text-xs text-slate-400">
          Showing {filteredPayments.length} of {payments.length} loaded requests.
          {payments.length === PAGE_SIZE &&
            ' Only the latest 100 requests are loaded.'}
        </p>

        {/* Payment Details Modal */}
        {selectedPayment && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedPayment(null);
              }
            }}
          >
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">

              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Payment Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Request #{String(selectedPayment.id).slice(0, 12)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                  aria-label="Close details"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-7">

                {/* Status and Amount */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Payment amount
                    </p>

                    <p
                      className="mt-1 text-2xl font-bold"
                      style={{ color: secondary }}
                    >
                      {formatPrice(selectedPayment.amount)}
                    </p>
                  </div>

                  <StatusBadge status={selectedPayment.status} />
                </div>

                {/* Customer Information */}
                <section>
                  <h3 className="mb-4 font-bold text-slate-900">
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailItem
                      icon={User}
                      label="Full Name"
                      value={selectedPayment.full_name}
                    />

                    <DetailItem
                      icon={Mail}
                      label="Email"
                      value={selectedPayment.email}
                    />

                    <DetailItem
                      icon={Phone}
                      label="Customer Phone"
                      value={selectedPayment.phone_number}
                    />

                    <DetailItem
                      icon={Wallet}
                      label="Sender Wallet Number"
                      value={selectedPayment.sender_phone}
                    />
                  </div>
                </section>

                <div className="border-t border-slate-100" />

                {/* Transaction Information */}
                <section>
                  <h3 className="mb-4 font-bold text-slate-900">
                    Transaction Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailItem
                      icon={GraduationCap}
                      label="Course"
                      value={
                        selectedPayment.course?.title ||
                        'Course unavailable'
                      }
                    />

                    <DetailItem
                      icon={Wallet}
                      label="Payment Method"
                      value={selectedPayment.payment_method}
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Submitted At"
                      value={formatDate(selectedPayment.created_at)}
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Last Updated"
                      value={formatDate(selectedPayment.updated_at)}
                    />
                  </div>

                  <div className="mt-4">
                    <DetailItem
                      icon={User}
                      label="User ID"
                      value={selectedPayment.user_id}
                    />
                  </div>
                </section>

                <div className="border-t border-slate-100" />

                {/* Payment Receipt */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <ImageIcon size={18} style={{ color: secondary }} />

                    <h3 className="font-bold text-slate-900">
                      Payment Receipt
                    </h3>
                  </div>

                  {selectedPayment.receiptSignedUrl ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <a
                        href={selectedPayment.receiptSignedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img
                          src={selectedPayment.receiptSignedUrl}
                          alt="Payment receipt"
                          className="max-h-[420px] w-full object-contain"
                        />
                      </a>

                      <a
                        href={selectedPayment.receiptSignedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
                        style={{ color: secondary }}
                      >
                        Open Full Image
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Receipt image is unavailable. Check the storage file and its permissions.
                    </div>
                  )}
                </section>

                {/* Admin Actions */}
                {selectedPayment.status === 'pending' && (
                  <section className="border-t border-slate-100 pt-5">
                    <h3 className="mb-3 font-bold text-slate-900">
                      Review Payment
                    </h3>

                    <p className="mb-4 text-sm leading-6 text-slate-500">
                      Approving this request marks the payment as paid
                      and activates the customer's course access.
                      Rejecting it marks the payment as failed.
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={updatePaymentMutation.isPending}
                        onClick={() =>
                          handlePaymentAction(selectedPayment, 'paid')
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {updatePaymentMutation.isPending ? (
                          <RefreshCw
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}

                        Approve Payment
                      </button>

                      <button
                        type="button"
                        disabled={updatePaymentMutation.isPending}
                        onClick={() =>
                          handlePaymentAction(selectedPayment, 'failed')
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle size={18} />
                        Reject Payment
                      </button>
                    </div>
                  </section>
                )}

                {/* Updating */}
                {updatePaymentMutation.isPending && (
                  <p className="text-center text-sm text-slate-500">
                    Updating payment and course access...
                  </p>
                )}

                {/* Action Error */}
                {actionError && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {actionError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
        <Icon size={14} />
        {label}
      </div>

      <p className="break-words text-sm font-medium text-slate-800">
        {value || '—'}
      </p>
    </div>
  );
}
