import { useDownloadContext } from '../context/DownloadContext';

function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function DownloadManager() {
  const { downloads, startDownload, pauseDownload, removeDownload, clearDoneDownloads } = useDownloadContext();

  const downloadEntries = [...downloads.values()].reverse(); // newest first
  const activeCount = downloadEntries.filter(d => d.status === 'downloading').length;
  const doneCount = downloadEntries.filter(d => d.status === 'done').length;

  return (
    <div className="animate-fadeIn">
      <div className="upload-manager-header">
        <div className="flex flex-wrap items-center justify-between gap-md" style={{ marginBottom: 'var(--space-md)' }}>
          <div>
            <div className="upload-engine-badge">
              <span className="upload-engine-dot" style={{ backgroundColor: 'var(--primary)' }} />
              Download Manager
            </div>
            <h1 className="text-headline-lg" style={{ color: 'var(--on-primary-container)', marginBottom: 4 }}>Download Manager</h1>
            <p className="text-body-md text-muted">Track all your file downloads. Resume paused or interrupted downloads right where they left off.</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <div className="upload-queue-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-sm">
              <h2 className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>Transfer Queue</h2>
              {activeCount > 0 && <span className="upload-queue-count">{activeCount} Active</span>}
              {doneCount > 0 && <span className="text-label-sm text-success">{doneCount} Completed</span>}
            </div>
            {doneCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={clearDoneDownloads}>Clear Completed</button>
            )}
          </div>
        </div>

        {downloadEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>download</span>
            </div>
            <p className="text-headline-sm text-muted">No downloads yet.</p>
          </div>
        ) : (
          <div className="upload-queue">
            {downloadEntries.map(dl => (
              <div className="upload-queue-item" key={dl.id}>
                <div className="upload-item-header">
                  <div className="upload-item-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>downloading</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="upload-item-name truncate">{dl.name}</div>
                    <span className="upload-item-size">{formatSize(dl.size)}</span>
                  </div>
                  <div className="upload-item-status flex gap-xs">
                    {(dl.status === 'idle' || dl.status === 'paused' || dl.status === 'error') && (
                      <button className="btn btn-primary btn-sm" onClick={() => startDownload(dl.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                        {dl.status === 'error' ? 'Retry' : (dl.status === 'paused' ? 'Resume' : 'Start')}
                      </button>
                    )}
                    {dl.status === 'downloading' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => pauseDownload(dl.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pause</span>
                        Pause
                      </button>
                    )}
                    
                    {dl.status === 'done' && (
                      <span className="upload-status-badge" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                        Complete
                      </span>
                    )}

                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeDownload(dl.id)} title="Remove">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  </div>
                </div>

                {dl.status !== 'idle' && (
                  <div className="upload-progress-section">
                    <div className="upload-progress-bar">
                      <div
                        className={`upload-progress-fill ${
                          dl.status === 'done' ? 'upload-progress-fill-done' :
                          dl.status === 'error' ? 'upload-progress-fill-error' : ''
                        }`}
                        style={{ width: `${dl.progress}%` }}
                      />
                    </div>
                    <div className="upload-chunk-info flex justify-between text-muted text-label-sm">
                      <span>{dl.progress}% completed</span>
                      <span>
                        {formatSize(dl.receivedBytes)} / {formatSize(dl.size)}
                        {dl.status === 'error' && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>{dl.error}</span>}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
