import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const formatSize = n => (n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

export default function FileDrop({ file, onFile, onError }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const accept = f => {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) { onError(`"${f.name}" is ${formatSize(f.size)} — files are limited to 5 MB.`); return; }
    onFile(f);
  };

  return (
    <div
      className={`dropzone ${over ? 'active' : ''} ${file ? 'has-file' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); accept(e.dataTransfer.files[0]); }}
    >
      <input ref={input} type="file" hidden onChange={e => { accept(e.target.files[0]); e.target.value = ''; }} />
      {file ? (
        <div className="file-info">
          <Upload size={20} />
          <span>{file.name}</span>
          <span className="file-size">({formatSize(file.size)})</span>
          <button className="clear-file" onClick={e => { e.stopPropagation(); onFile(null); }} aria-label="Remove file"><X size={14} /></button>
        </div>
      ) : (
        <div className="dropzone-inner">
          <Upload size={32} />
          <p>Drop a file here, or <strong>click to browse</strong></p>
          <p className="drop-hint">Base64, Hex, Binary or any hash (e.g. SHA-256 checksum) · max 5 MB</p>
        </div>
      )}
    </div>
  );
}
