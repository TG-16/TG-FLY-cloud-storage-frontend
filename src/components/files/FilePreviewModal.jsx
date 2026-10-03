import { useState, useEffect } from 'react';
import { useDownloadContext } from '../../context/DownloadContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

function formatSize(mb) {
  const val = Number(mb) || 0;
  if (val >= 1024) return `${(val / 1024).toFixed(1)} GB`;
  if (val >= 1) return `${val.toFixed(1)} MB`;
  return `${(val * 1024).toFixed(0)} KB`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function FileTypeIcon({ mimeType }) {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  return '📄';
}

export default function FilePreviewModal({ file, onClose }) {
  const { queueDownload, startDownload } = useDownloadContext();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const isPreviewable = file.mime_type?.startsWith('image/') || file.mime_type?.startsWith('video/') || file.mime_type?.startsWith('audio/');
    if (isPreviewable) {
      setLoadingPreview(true);
      api.getDownloadUrl(file.id)
        .then(res => setPreviewUrl(res.presignedUrl))
        .catch(() => { /* ignore */ })
        .finally(() => setLoadingPreview(false));
    }
  }, [file]);

  const handleDownload = () => {
    const downloadId = queueDownload(file);
    startDownload(downloadId);
    onClose();
    navigate('/download-manager');
  };

  const renderPreview = () => {
    if (loadingPreview) {
      return (
        <div className="preview-placeholder">
          <span className="spinner" />
          <span className="preview-hint">Loading preview...</span>
        </div>
      );
    }

    if (previewUrl) {
      if (file.mime_type?.startsWith('image/')) {
        return <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />;
      }
      if (file.mime_type?.startsWith('video/')) {
        return <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '400px' }} />;
      }
      if (file.mime_type?.startsWith('audio/')) {
        return <audio src={previewUrl} controls style={{ width: '100%', marginTop: 20 }} />;
      }
    }

    return (
      <div className="preview-placeholder">
        <span className="preview-icon">{FileTypeIcon({ mimeType: file.mime_type })}</span>
        <span className="preview-type">{file.mime_type || 'Unknown type'}</span>
      </div>
    );
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title truncate">{file.original_name}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Preview area */}
        <div className="preview-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--surface-lowest)', padding: 16, borderRadius: 'var(--rounded-md)', marginBottom: 16 }}>
          {renderPreview()}
        </div>

        {/* File info */}
        <div className="preview-info">
          <div className="preview-info-row">
            <span className="text-muted">Size</span>
            <span>{formatSize(file.size_mb)}</span>
          </div>
          <div className="preview-info-row">
            <span className="text-muted">Type</span>
            <span>{file.mime_type || 'Unknown'}</span>
          </div>
          <div className="preview-info-row">
            <span className="text-muted">Uploaded</span>
            <span>{formatDate(file.created_at)}</span>
          </div>
        </div>

        <div className="flex gap-sm">
          <button
            className="btn btn-gradient w-full"
            onClick={handleDownload}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Send to Download Manager
          </button>
        </div>
      </div>
    </div>
  );
}
