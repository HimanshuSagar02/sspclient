import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getApiErrorMessage } from '@/utils/apiErrors';

type DueMeta = {
  feeStatus: string;
  feeDueAmount: number;
  monthlyFeeAmount?: number;
  nextFeeDueAt?: string;
};


export const StudentDuePaymentPage = () => {
  const queryClient = useQueryClient();

  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ studentMeta?: DueMeta }>>('/auth/me');
      return res.data.data.studentMeta;
    },
  });

  const dueAmount = me?.feeDueAmount ?? 0;
  const canPay = me?.feeStatus === 'due' && dueAmount > 0;

  const createOrder = useMutation({
    mutationFn: async ({ amountDue }: { amountDue: number }) => {
      // We ask server to create Razorpay order; backend will validate due amount
      const res = await api.post<ApiResponse<any>>('/payments-due/razorpay/order', {
        amountDue,
      });
      return res.data.data;
    },
  });

  const verifyPayment = useMutation({
    mutationFn: async (payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      receiptNumber: string;
    }) => {
      const res = await api.post<ApiResponse<any>>('/payments-due/razorpay/verify', payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Payment successful — receipt generated');
      void queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Payment failed')),
  });

  useEffect(() => {
    // Load razorpay checkout script
    // If already present, ignore
    if (window.Razorpay) return;

    const existing = document.querySelector('script[data-razorpay]');
    if (existing) return;

    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.dataset.razorpay = 'true';
    document.body.appendChild(s);
  }, []);

  const payWithRazorpay = async () => {
    if (!canPay) return;
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded');
      return;
    }

    const order = await createOrder.mutateAsync({ amountDue: dueAmount });

    const options = {
      key: order.keyId, // optional depending on backend; if not provided, Razorpay will still require key
      amount: order.amount * 100,
      currency: order.currency ?? 'INR',
      name: 'Srishti Study Point',
      description: 'Fee payment',
      order_id: order.orderId,
      handler: (response: any) => {
        verifyPayment.mutate({
          razorpayOrderId: order.orderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          receiptNumber: order.receiptNumber,
        });
      },
      prefill: {
        // optional
      },
      theme: { color: '#0f766e' },
    };

    // If backend doesn't return keyId, attempt to call with only order_id.
    // Razorpay checkout needs key.
    if (!options.key && order.keyId) options.key = order.keyId;

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Due Payment</h1>
      <p className="mt-1 text-slate-600">Pay your monthly due using Razorpay</p>

      {loadingMe ? (
        <Skeleton className="mt-4 h-28" />
      ) : (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-sm">
          <p>
            Status: <strong className="capitalize">{me?.feeStatus ?? '—'}</strong>
          </p>
          <p className="mt-1">Due amount: ₹{dueAmount}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <Button onClick={payWithRazorpay} disabled={!canPay || createOrder.isPending || verifyPayment.isPending}>
          {createOrder.isPending || verifyPayment.isPending ? 'Processing...' : `Pay ₹${dueAmount} with Razorpay`}
        </Button>
        {!canPay ? <p className="mt-2 text-sm text-slate-500">No due right now.</p> : null}
      </div>
    </div>
  );
};

