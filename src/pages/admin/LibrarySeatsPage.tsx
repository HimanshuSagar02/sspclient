import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

type SeatStatus = 'occupied' | 'vacant';

type SeatItem = {
  seatNumber: number;
  status: SeatStatus;
  libraryId?: string;
};

export const LibrarySeatsPage = () => {
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(100);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-library-seats', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('from', String(from));
      params.set('to', String(to));
      const res = await api.get<ApiResponse<SeatItem[]>>(`/site/admin/library-seats?${params}`);
      return res.data.data;
    },
  });

  const seats = data ?? [];

  const seatCells = useMemo(() => {
    // Render as grid; keys are stable.
    return seats.map((s) => {
      const isOccupied = s.status === 'occupied';
      const tileClass = isOccupied
        ? 'border-red-200 bg-red-50 hover:border-red-300'
        : 'border-emerald-200 bg-emerald-50 hover:border-emerald-300';
      return (
        <button
          key={s.seatNumber}
          type="button"
          className={`group relative rounded-xl border px-3 py-3 text-left transition hover:shadow-sm ${tileClass}`}
          title={isOccupied ? `Occupied (Seat ${s.seatNumber})` : `Vacant (Seat ${s.seatNumber})`}
          onClick={() => {
            if (isOccupied && s.libraryId) {
              toast(`Occupied · ${s.libraryId}`);
            }
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Seat {s.seatNumber}</div>
              <div className="mt-1 text-xs text-slate-600">
                {isOccupied ? (s.libraryId ?? 'Filled') : 'Available'}
              </div>
            </div>
            <StatusBadge status={s.status} />
          </div>
        </button>
      );
    });
  }, [seats]);

  return (
    <section>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Library Seats</h1>
          <p className="mt-1 text-slate-600">Occupied / Vacant view (Admin)</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">From</span>
            <input
              type="number"
              min={1}
              value={from}
              onChange={(e) => setFrom(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">To</span>
            <input
              type="number"
              min={1}
              value={to}
              onChange={(e) => setTo(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <Button
            size="sm"
            onClick={() => {
              if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < 1 || from > to) {
                toast.error('Invalid seat range');
                return;
              }
              void refetch();
            }}
          >
            Refresh
          </Button>
        </div>
      </header>

      <article className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        {isLoading ? (
          <div className="text-sm text-slate-500">Loading seats...</div>
        ) : seats.length === 0 ? (
          <div className="text-sm text-slate-500">No data.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {seatCells}
          </div>
        )}
      </article>

      {/* Toast description prop avoided for compatibility */}
    </section>
  );
};


