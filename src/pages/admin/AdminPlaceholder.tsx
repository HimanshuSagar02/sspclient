export const AdminPlaceholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
    <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
    <p className="mt-2 max-w-md text-sm text-slate-500">
      Module scaffolded — extend with full CRUD, tables, and API integration. Backend
      models and routes are ready.
    </p>
  </div>
);
