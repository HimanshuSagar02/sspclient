import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse, LibraryStudentRow } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/utils/apiErrors';

interface PaymentRow {
  _id: string;
  receiptNumber: string;
  studentName: string;
  amount: number;
  method: string;
  paidAt?: string;
  notes?: string;
  upiReference?: string;
}

export const PaymentsManagement = () => {
  const queryClient = useQueryClient();
  const [libraryStudentId, setLibraryStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['admin-library-pay'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LibraryStudentRow[]>>(
        '/admin/library-students?limit=100'
      );
      return res.data.data;
    },
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentRow[]>>('/payments/?limit=30');
      return res.data.data;
    },
  });

  const markCash = useMutation({
    mutationFn: async () => {
      await api.post('/payments/cash', {
        libraryStudentId,
        amount: Number(amount),
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Cash payment recorded — receipt generated');
      setAmount('');
      setNotes('');
      void queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-library'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed')),
  });

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
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
      <p className="mt-1 text-slate-600">Mark cash payments and view UPI receipts</p>

      <section className="mt-8 max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Record cash payment</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            markCash.mutate();
          }}
        >
          <label className="block text-sm">
            <span className="font-medium">Library student</span>
            <select
              required
              value={libraryStudentId}
              onChange={(e) => setLibraryStudentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select student</option>
              {(students ?? []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.profile?.fullName ?? s.libraryId} — due ₹{s.feeDueAmount}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Amount (₹)</span>
            <input
              required
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Notes</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" disabled={markCash.isPending || loadingStudents}>
            Mark paid & generate receipt
          </Button>
        </form>
      </section>

      <h2 className="mt-10 text-lg font-semibold">Recent payments</h2>
      {isLoading ? (
        <Skeleton className="mt-4 h-48 w-full" />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{p.receiptNumber}</td>
                  <td className="px-4 py-3">{p.studentName}</td>
                  <td className="px-4 py-3">₹{p.amount}</td>
                  <td className="px-4 py-3 uppercase">{p.method}</td>
                  <td className="px-4 py-3 max-w-xs text-slate-600">
                    {p.notes ? (
                      <span title={p.notes} className="line-clamp-2 break-words">
                        {p.notes}
                      </span>
                    ) : p.upiReference ? (
                      <span className="text-xs text-slate-400">UPI: {p.upiReference}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void openReceipt(p.receiptNumber)}
                      className="text-brand-600 hover:underline"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
