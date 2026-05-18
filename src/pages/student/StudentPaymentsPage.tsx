import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getApiErrorMessage } from '@/utils/apiErrors';

interface PaymentRow {
  _id: string;
  receiptNumber: string;
  amount: number;
  method: 'upi' | 'cash';
  paidAt?: string;
  upiReference?: string;
}

type LibraryMeta = {
  feeStatus: string;
  feeDueAmount: number;
  monthlyFeeAmount?: number;
  nextFeeDueAt?: string;
  registeredAt?: string;
};

type RazorpayOrder = {
  orderId: string;
  amount: number;
  currency?: string;
  keyId?: string;
  receiptNumber: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export const StudentPaymentsPage = () => {
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ studentMeta?: LibraryMeta }>>('/auth/me');
      return res.data.data.studentMeta;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentRow[]>>('/payments/mine');
      return res.data.data;
    },
  });

  const dueAmount = me?.feeDueAmount ?? 0;
  const canPay = me?.feeStatus === 'due' && dueAmount > 0;

  // Lazy-load the Razorpay checkout script once.
  useEffect(() => {
    if (typeof window === 'undefined' || window.Razorpay) return;
    if (document.querySelector('script[data-razorpay]')) return;
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.dataset.razorpay = 'true';
    document.body.appendChild(s);
  }, []);

  const createOrder = useMutation({
    mutationFn: async (amountDue: number) => {
      const res = await api.post<ApiResponse<RazorpayOrder>>('/payments-due/razorpay/order', {
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
      await api.post('/payments-due/razorpay/verify', payload);
    },
    onSuccess: () => {
      toast.success('Payment successful \u2014 receipt available below');
      void queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Payment verification failed')),
  });

  const [processing, setProcessing] = useState(false);

  const payWithRazorpay = async () => {
    if (!canPay) return;
    if (!window.Razorpay) {
      toast.error('Razorpay is still loading \u2014 please try again in a moment');
      return;
    }
    try {
      setProcessing(true);
      const order = await createOrder.mutateAsync(dueAmount);
      if (!order.keyId) {
        toast.error('Razorpay key not configured on server');
        return;
      }
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency ?? 'INR',
        name: 'Srishti Study Point',
        description: 'Library fee payment',
        order_id: order.orderId,
        handler: (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          verifyPayment.mutate({
            razorpayOrderId: order.orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            receiptNumber: order.receiptNumber,
          });
        },
        modal: {
          ondismiss: () =>
            toast('Payment cancelled', { icon: '\u26A0\uFE0F' }),
        },
        theme: { color: '#0d9488' },
      });
      rzp.open();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not start payment'));
    } finally {
      setProcessing(false);
    }
  };

  const openReceipt = async (receiptNumber: string) => {
    try {
      const res = await api.get(`/payments/receipt/${receiptNumber}?format=html`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to open receipt'));
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Fee Payment</h1>
      <p className="mt-1 text-slate-600">Secure online payment via Razorpay</p>

      {me ? (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-sm">
          <p>
            Status: <strong className="capitalize">{me.feeStatus}</strong> — ₹{me.feeDueAmount} due now
          </p>
          {me.monthlyFeeAmount ? (
            <p className="mt-1 text-slate-600">Monthly fee: ₹{me.monthlyFeeAmount}</p>
          ) : null}
          {me.nextFeeDueAt ? (
            <p className="mt-1 text-slate-600">
              Billing cycle due date: {new Date(me.nextFeeDueAt).toLocaleDateString('en-IN')}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Pay now</h2>
        <p className="mt-1 text-sm text-slate-600">
          Clicking the button below opens the Razorpay checkout. You can pay with UPI (PhonePe,
          Google Pay, Paytm), debit/credit card, or netbanking. The payment is verified and the
          receipt is generated automatically — no manual entry required.
        </p>
        <div className="mt-4">
          <Button
            onClick={() => void payWithRazorpay()}
            disabled={
              !canPay || processing || createOrder.isPending || verifyPayment.isPending
            }
          >
            {createOrder.isPending || verifyPayment.isPending || processing
              ? 'Processing...'
              : canPay
                ? `Pay \u20B9${dueAmount} with Razorpay`
                : 'No dues right now'}
          </Button>
        </div>
        {!canPay ? (
          <p className="mt-3 text-sm text-slate-500">
            You have no pending fee. Your next billing cycle will create a new due automatically.
          </p>
        ) : null}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Payment history</h2>
      {isLoading ? (
        <Skeleton className="mt-4 h-32 w-full" />
      ) : (
        <ul className="mt-4 space-y-3">
          {(data ?? []).map((p) => (
            <li
              key={p._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-4"
            >
              <div>
                <p className="font-mono text-sm text-brand-700">{p.receiptNumber}</p>
                <p className="text-sm text-slate-600">
                  ₹{p.amount} · {p.method.toUpperCase()}
                  {p.upiReference ? ` · ${p.upiReference}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void openReceipt(p.receiptNumber)}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Download receipt
              </button>
            </li>
          ))}
          {!data?.length ? <p className="text-sm text-slate-500">No payments yet.</p> : null}
        </ul>
      )}
    </div>
  );
};

