import { ImageUp } from 'lucide-react';
import { useId } from 'react';

const UploadReceipt = ({ value, onChange, error }) => {
  const id = useId();
  return <div><input id={id} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => onChange(event.target.files?.[0] || null)} /><label htmlFor={id} className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-black/20 px-5 py-8 text-center transition hover:border-[var(--color-accent)] hover:bg-amber-50"><ImageUp size={30} className="mb-3 text-[var(--color-accent)]" /><strong className="text-sm">{value ? value.name : 'ارفع صورة إثبات التحويل'}</strong><span className="mt-1 text-xs text-black/55">PNG أو JPG أو WEBP — حتى 5MB</span></label>{error && <p className="mt-2 text-xs text-red-600">{error}</p>}</div>;
};
export default UploadReceipt;
