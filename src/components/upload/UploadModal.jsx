import { useRef, useState } from 'react';
import { useUploadContext } from '../../context/UploadContext';
import { useNavigate } from 'react-router-dom';

function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function UploadModal({ folderId, onClose }) {
  const { uploads, queueFiles, uploadFile, removeUpload } = useUploadContext();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const filesArray = Array.from(e.dataTransfer.files);
    if (filesArray.length > 0) {
      queueFiles(filesArray, folderId);
    }
  };

  const handleFileSelect = (e) => {
    const filesArray = Array.from(e.target.files);
    e.target.value = '';
    if (filesArray.length > 0) {
      queueFiles(filesArray, folderId);
    }
  };

  const handleGoToManager = () => {
    onClose();
    navigate('/upload-manager');
  };

  const uploadEntries = [...uploads.entries()];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal upload-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Upload files</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Drop zone */}
        <div
          className={`upload-dropzone ${dragOver ? 'upload-dropzone-active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-dropzone-icon">
            {dragOver ? '📥' : '☁️'}
          </div>
          <p className="upload-dropzone-text">
            {dragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="upload-dropzone-hint">
            Supports images, videos, audio, documents, archives
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'none' }}
          />
        </div>

        {/* Upload queue */}
        {uploadEntries.length > 0 && (
          <div className="upload-queue">
            {uploadEntries.map(([id, upload]) => (
              <div className="upload-item" key={id}>
                <div className="upload-item-info">
                  <span className="upload-item-name truncate">{upload.name}</span>
                  <span className="upload-item-size">{formatSize(upload.size)}</span>
                </div>
                
                {/* Status or Progress */}
                {upload.status !== 'idle' && (
                  <div className="upload-item-progress">
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${
                          upload.status === 'done' ? 'progress-fill-success' :
                          upload.status === 'error' ? 'progress-fill-error' : ''
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <div className="upload-item-status">
                      {upload.status === 'initiating' && <span className="text-muted">Starting...</span>}
                      {upload.status === 'uploading' && <span className="text-muted">{upload.progress}%</span>}
                      {upload.status === 'completing' && <span className="text-muted">Finalizing...</span>}
                      {upload.status === 'done' && <span style={{ color: 'var(--success)' }}>✓ Done</span>}
                      {upload.status === 'error' && <span style={{ color: 'var(--error)' }}>✕ {upload.error}</span>}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="upload-item-actions flex items-center gap-xs" style={{ marginTop: 8 }}>
                  {upload.status === 'idle' && (
                    <button className="btn btn-primary btn-sm" onClick={() => uploadFile(id)}>
                      Upload
                    </button>
                  )}
                  {(upload.status === 'idle' || upload.status === 'done' || upload.status === 'error') && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeUpload(id)} title="Remove">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-sm" style={{ marginTop: 'var(--space-4)' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: '1 1 200px' }}>
            Close Window
          </button>
          <button className="btn btn-primary" onClick={handleGoToManager} style={{ flex: '1 1 200px' }}>
            Track in Upload Manager
          </button>
        </div>
      </div>
    </div>
  );
}
