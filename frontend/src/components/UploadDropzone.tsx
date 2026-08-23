import { useRef, useState } from 'react';
import { FileIcon, UploadCloudIcon, XIcon } from 'lucide-react';
import type { MediaType } from '../types/culture';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';
const ACCEPT: Record<MediaType, string> = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  text: '.txt,.md'
};
interface UploadDropzoneProps {
  mediaType: MediaType;
  file: {
    name: string;
    url: string;
  } | null;
  onFile: (file: {
    name: string;
    url: string;
  } | null) => void;
  className?: string;
}
export function UploadDropzone({
  mediaType,
  file,
  onFile,
  className
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const accept = (selected: File) => {
    setProgress(0);
    const url = URL.createObjectURL(selected);
    let value = 0;
    const timer = window.setInterval(() => {
      value += 18;
      if (value >= 100) {
        window.clearInterval(timer);
        setProgress(null);
        onFile({
          name: selected.name,
          url
        });
      } else {
        setProgress(value);
      }
    }, 120);
  };
  if (file) {
    return <div className={cn('flex items-center gap-3 rounded-card border border-sand-light bg-paper p-4', className)}>
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sand-lighter text-charcoal-muted">
          <FileIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-charcoal">{file.name}</p>
          <p className="text-[12px] text-charcoal-soft">Stored as the original source file</p>
        </div>
        <button type="button" onClick={() => onFile(null)} aria-label="Remove file" className="text-charcoal-soft transition-colors duration-150 ease-firm hover:text-flagged">
          <XIcon className="h-4 w-4" />
        </button>
      </div>;
  }
  return <div onDragOver={(e) => {
    e.preventDefault();
    setDragging(true);
  }} onDragLeave={() => setDragging(false)} onDrop={(e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) accept(dropped);
  }} className={cn('flex flex-col items-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 ease-firm', dragging ? 'border-terracotta bg-terracotta-50' : 'border-sand-light bg-paper', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-lighter text-charcoal-muted">
        <UploadCloudIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium text-charcoal">Drop your {mediaType} here</p>
      <p className="mt-1 text-[13px] text-charcoal-muted">or choose a file from your device</p>

      {progress !== null ? <div className="mt-5 w-full max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-sand-lighter">
            <div className="h-full bg-terracotta transition-[width] duration-150 ease-linear" style={{
          width: `${progress}%`
        }} />
          </div>
          <p className="mt-2 text-[12px] text-charcoal-soft">Uploading… {progress}%</p>
        </div> : <Button variant="secondary" size="sm" className="mt-5" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>}

      <input ref={inputRef} type="file" accept={ACCEPT[mediaType]} className="hidden" onChange={(e) => {
      const selected = e.target.files?.[0];
      if (selected) accept(selected);
    }} />
    </div>;
}