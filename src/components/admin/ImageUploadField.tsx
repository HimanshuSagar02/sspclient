import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { getApiErrorMessage } from '@/utils/apiErrors';

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: 'site' | 'results';
  previewClassName?: string;
};

export const ImageUploadField = ({
  label,
  value,
  onChange,
  folder = 'site',
  previewClassName = 'mt-3 h-32 w-full max-w-md rounded-lg object-cover',
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    const body = new FormData();
    body.append('image', file);
    body.append('folder', folder);
    setUploading(true);
    try {
      const res = await api.post<ApiResponse<{ url: string }>>('/site/admin/upload-image', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.data.url);
      toast.success('Image uploaded to Cloudinary');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed — is the server running?'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : value ? 'Replace image' : 'Upload image'}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = '';
        }}
      />
      {value ? <img src={value} alt="" className={previewClassName} /> : null}
    </div>
  );
};
