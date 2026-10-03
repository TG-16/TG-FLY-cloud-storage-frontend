import { useRef, useState } from 'react';
import { useUploadContext } from '../context/UploadContext';
import { useToast } from '../context/ToastContext';

function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function getFileIcon(mimeType) {
  if (!mimeType) return 'description';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'movie';
  if (mimeType.startsWith('audio/')) return 'headphones';
  if (mimeType.includes('pdf')) return 'picture_as_pdf';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'folder_zip';
  return 'description';
}

export default function UploadManager() {
  const { uploads, queueFiles, uploadFile, removeUpload, clearDoneUploads } = useUploadContext();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const filesArray = Array.from(e.dataTransfer.files);
    if (filesArray.length > 0) {
      queueFiles(filesArray);
    }
  };

  const handleFileSelect = (e) => {
    const filesArray = Array.from(e.target.files);
    e.target.value = '';
    if (filesArray.length > 0) {
      queueFiles(filesArray);
    }
  };

  const uploadEntries = [...uploads.entries()];
  const activeCount = uploadEntries.filter(([, u]) => u.status === 'uploading' || u.status === 'initiating' || u.status === 'completing').length;
  const doneCount = uploadEntries.filter(([, u]) => u.status === 'done').length;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="upload-manager-header">
        <div className="flex flex-wrap items-center justify-between gap-md" style={{ marginBottom: 'var(--space-md)' }}>
          <div>
            <div className="upload-engine-badge">
              <span className="upload-engine-dot" />
              Resumable Transfer Engine v2.1
            </div>
            <h1 className="text-headline-lg" style={{ color: 'var(--on-primary-container)', marginBottom: 4 }}>Upload Manager</h1>
            <p className="text-body-md text-muted">Every file is split into verifiable 5 MB chunks. If your connection drops, the upload resumes exactly where it stopped — zero bytes wasted.</p>
          </div>
          <div className="network-quality hide-mobile">
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--success)' }}>signal_cellular_alt</span>
            <div>
              <div className="text-label-sm" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>Network Quality</div>
              <div className="text-label-sm text-muted">Good — TeleCloud Direct</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        className={`upload-dropzone ${dragOver ? 'upload-dropzone-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-dropzone-icon">
          <span className="material-symbols-outlined" style={{ fontSize: 56 }}>
            {dragOver ? 'download' : 'cloud_upload'}
          </span>
        </div>
        <h3 className="text-headline-sm" style={{ color: 'var(--on-surface)', marginBottom: 4 }}>
          {dragOver ? 'Drop files to begin upload' : 'Drag & Drop Files Here'}
        </h3>
        <p className="text-body-md text-muted" style={{ marginBottom: 8 }}>
          or <span style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>Browse Computer</span>
        </p>
        <div className="upload-dropzone-tags">
          {['Documents', 'Photos', 'Videos', 'Music', 'Archives'].map(tag => (
            <span className="upload-dropzone-tag" key={tag}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
              {tag}
            </span>
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload Queue */}
      {uploadEntries.length > 0 && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <div className="upload-queue-header">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-sm">
                <h2 className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>Transfer Queue</h2>
                {activeCount > 0 && (
                  <span className="upload-queue-count">{activeCount} Active</span>
                )}
                {doneCount > 0 && (
                  <span className="text-label-sm text-success">{doneCount} Completed</span>
                )}
              </div>
              {doneCount > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={clearDoneUploads}>Clear Completed</button>
              )}
            </div>
          </div>

          <div className="upload-queue">
            {uploadEntries.map(([id, upload]) => (
              <div className="upload-queue-item" key={id}>
                <div className="upload-item-header">
                  <div className="upload-item-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{getFileIcon(upload.mimeType)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="upload-item-name truncate">{upload.name}</div>
                    <span className="upload-item-size">{formatSize(upload.size)}</span>
                  </div>
                  <div className="upload-item-status">
                    {upload.status === 'idle' && (
                      <button className="btn btn-primary btn-sm" onClick={() => uploadFile(id)} title="Start Upload">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                        <span className="hide-mobile">Start Upload</span>
                      </button>
                    )}
                    {upload.status === 'initiating' && (
                      <span className="upload-status-badge" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)' }}>
                        <span className="spinner spinner-sm" />
                        Starting
                      </span>
                    )}
                    {upload.status === 'uploading' && (
                      <span className="upload-status-badge" style={{ background: 'var(--primary-fixed)', color: 'var(--primary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload</span>
                        Uploading
                      </span>
                    )}
                    {upload.status === 'completing' && (
                      <span className="upload-status-badge" style={{ background: 'var(--primary-fixed)', color: 'var(--primary)' }}>
                        <span className="spinner spinner-sm" />
                        Finalizing
                      </span>
                    )}
                    {upload.status === 'done' && (
                      <span className="upload-status-badge" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                        Complete
                      </span>
                    )}
                    {upload.status === 'error' && (
                      <span className="upload-status-badge" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                        Failed
                      </span>
                    )}
                    {(upload.status === 'done' || upload.status === 'error' || upload.status === 'idle') && (
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeUpload(id)} title="Remove">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                {upload.status !== 'idle' && (
                  <div className="upload-progress-section">
                    <div className="upload-progress-bar">
                      <div
                        className={`upload-progress-fill ${
                          upload.status === 'done' ? 'upload-progress-fill-done' :
                          upload.status === 'error' ? 'upload-progress-fill-error' : ''
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <div className="upload-chunk-info">
                      <span>{upload.progress}% completed</span>
                      <span>{formatSize(upload.size * upload.progress / 100)} / {formatSize(upload.size)}</span>
                    </div>
                  </div>
                )}

                {upload.status === 'error' && upload.error && (
                  <div className="upload-connection-alert">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--warning)' }}>wifi_off</span>
                    <span>{upload.error} — Will auto-resume when connection restores.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why TG-Fly section */}
      <div className="upload-why-section">
        <div className="flex items-center gap-sm" style={{ marginBottom: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary)' }}>verified</span>
          <span className="text-label-lg" style={{ color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why TG-Fly</span>
        </div>
        <h3 className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>Why TG-Fly Uploads Never Fail</h3>
        <div className="why-cards">
          <div className="why-card">
            <div className="why-card-title">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary-container)' }}>memory</span>
              Chunk Architecture
            </div>
            <p className="why-card-desc">Files are divided into 5 MB atomic blocks. Each block is individually checksummed, uploaded, and verified. A 500 MB file becomes 100 independent, trackable transfer units.</p>
          </div>
          <div className="why-card">
            <div className="why-card-title">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>save</span>
              Local State Persistence
            </div>
            <p className="why-card-desc">Upload progress is saved in your browser's local storage after every successful chunk. If the tab crashes or power goes out, we know exactly which byte to resume from.</p>
          </div>
          <div className="why-card">
            <div className="why-card-title">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--success)' }}>autorenew</span>
              Automatic Recovery
            </div>
            <p className="why-card-desc">When your network reconnects, the engine instantly re-validates server-side state against local state and continues the transfer without any user intervention.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
