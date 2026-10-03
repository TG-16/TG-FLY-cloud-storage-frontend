import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UploadModal from '../components/upload/UploadModal';
import FilePreviewModal from '../components/files/FilePreviewModal';

function formatSize(mb) {
  const val = Number(mb) || 0;
  if (val >= 1024) return `${(val / 1024).toFixed(1)} GB`;
  if (val >= 1) return `${val.toFixed(1)} MB`;
  return `${(val * 1024).toFixed(0)} KB`;
}

function getFileColor(mimeType) {
  if (!mimeType) return 'var(--outline)';
  if (mimeType.startsWith('image/')) return 'var(--primary-container)';
  if (mimeType.startsWith('video/')) return 'var(--danger)';
  if (mimeType.startsWith('audio/')) return 'var(--warning)';
  if (mimeType.includes('pdf')) return '#e74c3c';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'var(--tertiary)';
  if (mimeType.includes('word') || mimeType.includes('document')) return '#2b5797';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '#217346';
  return 'var(--outline)';
}

function getFileIcon(mimeType) {
  if (!mimeType) return 'description';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'movie';
  if (mimeType.startsWith('audio/')) return 'headphones';
  if (mimeType.includes('pdf')) return 'picture_as_pdf';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'folder_zip';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'article';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'table_chart';
  return 'description';
}

function getFileExtension(mimeType) {
  if (!mimeType) return '';
  const map = {
    'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/gif': 'GIF', 'image/webp': 'WEBP', 'image/svg+xml': 'SVG',
    'video/mp4': 'MP4', 'video/quicktime': 'MOV', 'video/webm': 'WEBM',
    'audio/mpeg': 'MP3', 'audio/wav': 'WAV',
    'application/pdf': 'PDF',
    'application/zip': 'ZIP', 'application/x-rar-compressed': 'RAR',
  };
  return map[mimeType] || mimeType.split('/').pop()?.toUpperCase() || '';
}

function matchesFilter(file, filter) {
  if (filter === 'all') return true;
  if (filter === 'documents') return file.mime_type?.includes('pdf') || file.mime_type?.includes('word') || file.mime_type?.includes('document') || file.mime_type?.includes('sheet') || file.mime_type?.includes('text');
  if (filter === 'photos') return file.mime_type?.startsWith('image/');
  if (filter === 'videos') return file.mime_type?.startsWith('video/');
  if (filter === 'audio') return file.mime_type?.startsWith('audio/');
  return true;
}

const FILTERS = [
  { key: 'all', label: 'All Files', icon: 'grid_view' },
  { key: 'documents', label: 'Documents', icon: 'description' },
  { key: 'photos', label: 'Photos', icon: 'image' },
  { key: 'videos', label: 'Videos', icon: 'movie' },
  { key: 'audio', label: 'Audio', icon: 'headphones' },
];

export default function FileManager() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('all');
  const [dashData, setDashData] = useState(null);
  const searchTimeout = useRef(null);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        api.getFiles(folderId || null),
        api.getFolders(folderId || null),
      ]);
      setFiles(filesRes.files || []);
      setFolders(foldersRes.folders || []);
      if (folderId) {
        const pathRes = await api.getFolderPath(folderId);
        setBreadcrumb(pathRes.path || []);
      } else {
        setBreadcrumb([]);
      }
    } catch (err) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [folderId, toast]);

  useEffect(() => {
    setSearchResults(null);
    setSearchQuery('');
    fetchContents();
  }, [fetchContents]);

  useEffect(() => {
    async function fetchStorage() {
      try {
        const data = await api.getUserDashboard();
        setDashData(data);
      } catch { /* ignore */ }
    }
    fetchStorage();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.searchFiles(query);
        setSearchResults(res.files || []);
      } catch { /* ignore */ }
    }, 300);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName.trim(), folderId || null);
      toast.success('Folder created');
      setNewFolderName('');
      setShowNewFolder(false);
      fetchContents();
    } catch (err) {
      toast.error(err.message || 'Failed to create folder');
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    try {
      await api.deleteFile(fileId);
      toast.success('File deleted');
      fetchContents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleDeleteFolder = async (id, name) => {
    if (!window.confirm(`Delete folder "${name}" and all its contents?`)) return;
    try {
      await api.deleteFolder(id);
      toast.success('Folder deleted');
      fetchContents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const storageUsed = dashData?.storageUsed || user?.storage_used_mb || 0;
  const storageTotal = dashData?.storageTotal || 512;
  const storagePct = storageTotal > 0 ? Math.min((storageUsed / storageTotal) * 100, 100) : 0;
  const planName = dashData?.planName || 'Free';

  const rawFiles = searchResults !== null ? searchResults : files;
  const displayFiles = rawFiles.filter(f => matchesFilter(f, activeFilter));
  const displayFolders = searchResults !== null ? [] : folders;

  return (
    <div className="animate-fadeIn">
      {/* ─── STORAGE BANNER ─── */}
      <div className="storage-banner" style={{ minWidth: 0, width: '100%' }}>
        <div className="storage-banner-left" style={{ minWidth: 0, flex: 1 }}>
          <div className="storage-banner-icon flex-shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>cloud</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="text-headline-sm truncate" style={{ marginBottom: 2 }}>My Cloud Storage</div>
            <div className="text-body-sm text-muted" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
              {formatSize(storageUsed)} of {formatSize(storageTotal)} used — {planName} Plan
            </div>
          </div>
        </div>
        <div className="storage-banner-right">
          <div className="storage-meter hide-mobile">
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-muted">{formatSize(storageUsed)} / {formatSize(storageTotal)}</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{storagePct.toFixed(0)}%</span>
            </div>
            <div className="storage-meter-bar">
              <div className="storage-meter-fill" style={{ width: `${storagePct}%` }} />
            </div>
          </div>
          <Link to="/upgrade" className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>rocket_launch</span>
            Upgrade Storage
          </Link>
        </div>
      </div>

      {/* ─── BREADCRUMB ─── */}
      <div className="breadcrumb" style={{ marginBottom: 'var(--space-md)', minWidth: 0, width: '100%' }}>
        <Link to="/files" className="breadcrumb-link flex-shrink-0">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
          <span>Home</span>
        </Link>
        {breadcrumb.map((item) => (
          <span key={item.id} className="flex items-center gap-xs">
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--outline)' }}>chevron_right</span>
            <Link to={`/files/${item.id}`} className="breadcrumb-link">{item.name}</Link>
          </span>
        ))}
      </div>

      {/* ─── FILTER BAR ─── */}
      <div className="filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%' }}>
        <div className="flex flex-wrap items-center justify-between gap-md w-full" style={{ minWidth: 0 }}>
          <div className="filter-chips" style={{ overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', flex: 1, minWidth: 0 }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-chip ${activeFilter === f.key ? 'filter-chip-active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
          <div className="view-toggle flex-shrink-0">
            <button className={`view-toggle-btn ${viewMode === 'grid' ? 'view-toggle-active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>grid_view</span>
            </button>
            <button className={`view-toggle-btn ${viewMode === 'list' ? 'view-toggle-active' : ''}`} onClick={() => setViewMode('list')} title="List view">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>view_list</span>
            </button>
          </div>
        </div>
        
        <div className="filter-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%', minWidth: 0 }}>
          <div className="filter-search" style={{ flex: '1 1 100%', minWidth: 0 }}>
            <span className="material-symbols-outlined filter-search-icon">search</span>
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="flex gap-sm" style={{ width: '100%' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowNewFolder(true)} style={{ flex: 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>create_new_folder</span>
              <span>New Folder</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)} style={{ flex: 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cloud_upload</span>
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── NEW FOLDER ─── */}
      {showNewFolder && (
        <div className="card animate-slideUp" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)' }}>
          <span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--primary)', fontSize: 22 }}>create_new_folder</span>
          <input
            type="text"
            className="input"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
            style={{ flex: '1 1 200px', minWidth: 0 }}
          />
          <div className="flex gap-sm flex-shrink-0">
            <button className="btn btn-primary btn-sm" onClick={handleCreateFolder}>Create</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ─── CONTENT ─── */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'files-grid' : 'files-list'}>
          {[...Array(6)].map((_, i) => (
            <div className="skeleton" style={{ height: viewMode === 'grid' ? 220 : 56, borderRadius: 'var(--rounded-md)' }} key={i} />
          ))}
        </div>
      ) : displayFolders.length === 0 && displayFiles.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="empty-state-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>{searchResults !== null ? 'search_off' : 'folder_open'}</span>
          </div>
          <p className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>
            {searchResults !== null ? 'No files found' : 'This folder is empty'}
          </p>
          <p className="text-body-md text-muted">
            {searchResults !== null ? 'Try a different search query' : 'Upload files or create a folder to get started'}
          </p>
          {searchResults === null && (
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cloud_upload</span>
              Upload files
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Folders section */}
          {displayFolders.length > 0 && (
            <>
              <div className="section-header">
                <div className="flex items-center gap-sm">
                  <span className="text-label-lg" style={{ color: 'var(--on-surface)' }}>Folders</span>
                  <span className="section-count">{displayFolders.length}</span>
                </div>
              </div>
              <div className="folders-grid">
                {displayFolders.map(folder => (
                  <div className="folder-card" key={`f-${folder.id}`} onClick={() => navigate(`/files/${folder.id}`)}>
                    <div className="folder-card-left">
                      <div className="folder-icon-wrap">
                        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>folder</span>
                      </div>
                      <div>
                        <div className="folder-name truncate">{folder.name}</div>
                        <div className="folder-meta">Folder</div>
                      </div>
                    </div>
                    <button
                      className="folder-menu-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                      title="Delete folder"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete_outline</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Files section */}
          {displayFiles.length > 0 && (
            <>
              <div className="section-header">
                <div className="flex items-center gap-sm">
                  <span className="text-label-lg" style={{ color: 'var(--on-surface)' }}>Files</span>
                  <span className="section-count">{displayFiles.length}</span>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="files-grid">
                  {displayFiles.map(file => (
                    <div className="file-card" key={`file-${file.id}`} onClick={() => setPreviewFile(file)}>
                      {/* Preview area */}
                      <div className="file-card-preview" style={{ background: file.thumbnail_url ? 'var(--surface-low)' : `${getFileColor(file.mime_type)}15` }}>
                        {file.thumbnail_url ? (
                          <img src={file.thumbnail_url} alt="" />
                        ) : (
                          <>
                            <div className="file-card-type-icon" style={{ color: getFileColor(file.mime_type) }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{getFileIcon(file.mime_type)}</span>
                            </div>
                            <span className="file-card-type-label" style={{ color: getFileColor(file.mime_type) }}>{getFileExtension(file.mime_type)}</span>
                          </>
                        )}
                        <span className="file-card-badge">{formatSize(file.size_mb)}</span>
                        {file.mime_type?.startsWith('video/') && (
                          <div className="file-card-play">
                            <div className="file-card-play-btn">
                              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>play_arrow</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="file-card-info">
                        <span className="file-card-name truncate">{file.original_name}</span>
                        <span className="file-card-meta">{formatSize(file.size_mb)} • {new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                      {/* Actions */}
                      <div className="file-card-actions" onClick={e => e.stopPropagation()}>
                        <button className="file-card-download" onClick={() => setPreviewFile(file)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                          Download
                        </button>
                        <button className="file-card-share" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/dl/${file.id}`); toast.success('Link copied!'); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
                        </button>
                        <button className="file-card-share" onClick={() => handleDeleteFile(file.id, file.original_name)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--danger)' }}>delete_outline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="files-list">
                  {displayFiles.map(file => (
                    <div className="file-list-item" key={`file-${file.id}`} onClick={() => setPreviewFile(file)}>
                      <div className="file-list-icon" style={{ background: `${getFileColor(file.mime_type)}15`, color: getFileColor(file.mime_type) }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{getFileIcon(file.mime_type)}</span>
                      </div>
                      <div className="file-list-info">
                        <div className="text-label-lg truncate" style={{ color: 'var(--on-surface)' }}>{file.original_name}</div>
                        <div className="text-body-sm text-muted">{formatSize(file.size_mb)} • {new Date(file.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-xs" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPreviewFile(file)} title="Download">
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteFile(file.id, file.original_name)} title="Delete">
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--danger)' }}>delete_outline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── MODALS ─── */}
      {showUpload && (
        <UploadModal
          folderId={folderId || null}
          onClose={() => setShowUpload(false)}
          onComplete={() => { setShowUpload(false); fetchContents(); }}
        />
      )}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
