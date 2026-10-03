import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const DownloadContext = createContext(null);

function getDownloadState(fileId) {
  try {
    const data = localStorage.getItem(`tgfly_download_${fileId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveDownloadState(fileId, state) {
  localStorage.setItem(`tgfly_download_${fileId}`, JSON.stringify(state));
}

function clearDownloadState(fileId) {
  localStorage.removeItem(`tgfly_download_${fileId}`);
}

// Persist the overall downloads map metadata
function saveDownloadsMeta(downloadsMap) {
  try {
    const metaList = Array.from(downloadsMap.values()).map(dl => ({
      id: dl.id,
      fileId: dl.fileId,
      name: dl.name,
      size: dl.size,
      progress: dl.progress,
      status: dl.status === 'downloading' ? 'paused' : dl.status,
      error: dl.error,
      receivedBytes: dl.receivedBytes
    }));
    localStorage.setItem('tgfly_downloads_meta', JSON.stringify(metaList));
  } catch (err) {
    console.error('Failed to save downloads meta', err);
  }
}

function loadDownloadsMeta() {
  try {
    const data = localStorage.getItem('tgfly_downloads_meta');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function DownloadProvider({ children }) {
  const [downloads, setDownloads] = useState(() => {
    // Initialize from localStorage metadata
    const meta = loadDownloadsMeta();
    const map = new Map();
    meta.forEach(dl => {
      map.set(dl.id, {
        ...dl,
        controller: null,
        chunks: [] // Chunks cannot be persisted across reloads easily in memory
      });
    });
    return map;
  });
  
  const toast = useToast();

  // Save metadata to localStorage on every change
  useEffect(() => {
    saveDownloadsMeta(downloads);
  }, [downloads]);

  const updateDownload = useCallback((id, updates) => {
    setDownloads(prev => {
      const next = new Map(prev);
      const current = next.get(id) || {};
      next.set(id, { ...current, ...updates });
      return next;
    });
  }, []);

  const queueDownload = useCallback((file) => {
    const downloadId = `dl_${file.id}_${Date.now()}`;
    
    setDownloads(prev => {
      const next = new Map(prev);
      next.set(downloadId, {
        id: downloadId,
        fileId: file.id,
        name: file.original_name || file.name,
        size: (file.size_mb * 1024 * 1024) || file.size,
        progress: 0,
        status: 'idle', // 'idle', 'downloading', 'paused', 'done', 'error'
        error: null,
        controller: null,
        receivedBytes: 0,
        chunks: []
      });
      return next;
    });
    
    return downloadId;
  }, []);

  const startDownload = useCallback(async (downloadId) => {
    let dlData;
    setDownloads(prev => {
      dlData = prev.get(downloadId);
      return prev;
    });

    if (!dlData || (dlData.status !== 'idle' && dlData.status !== 'paused' && dlData.status !== 'error')) return;

    const controller = new AbortController();
    updateDownload(downloadId, { status: 'downloading', error: null, controller });

    try {
      // 1. Get presigned URL
      const res = await api.getDownloadUrl(dlData.fileId);
      const { presignedUrl, totalBytes } = res;

      // 2. Resume logic
      const savedState = getDownloadState(dlData.fileId);
      let startByte = dlData.receivedBytes || (savedState?.bytesReceived || 0);
      let chunks = dlData.chunks || [];

      // If we resumed but chunks is empty, it means page reloaded and we lost memory.
      // We must start over because we can't concatenate missing chunks easily via fetch without saving to disk incrementally.
      // For a robust implementation, we would write to File System Access API. 
      // For now, if memory chunks are lost, we restart download.
      if (startByte > 0 && chunks.length === 0) {
        startByte = 0;
        toast.info(`Restarting download for ${dlData.name} due to page reload`);
      }

      const headers = {};
      if (startByte > 0) {
        headers['Range'] = `bytes=${startByte}-`;
      }

      const response = await fetch(presignedUrl, { 
        headers, 
        signal: controller.signal 
      });

      if (!response.ok && response.status !== 206) {
        throw new Error('Server rejected download or file missing');
      }

      const reader = response.body.getReader();
      let received = startByte;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        received += value.length;
        
        saveDownloadState(dlData.fileId, { bytesReceived: received });

        const progress = Math.round((received / totalBytes) * 100);
        updateDownload(downloadId, { 
          progress, 
          receivedBytes: received, 
          chunks: [...chunks] 
        });
      }

      // 3. Complete
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dlData.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      clearDownloadState(dlData.fileId);
      updateDownload(downloadId, { status: 'done', progress: 100, controller: null, chunks: [] });
      toast.success(`${dlData.name} downloaded successfully`);

    } catch (err) {
      if (err.name === 'AbortError') {
        updateDownload(downloadId, { status: 'paused', controller: null });
        toast.info(`Paused ${dlData.name}`);
      } else {
        updateDownload(downloadId, { status: 'error', error: err.message, controller: null });
        toast.error(`Download failed: ${err.message}`);
      }
    }
  }, [updateDownload, toast]);

  const pauseDownload = useCallback((downloadId) => {
    setDownloads(prev => {
      const dl = prev.get(downloadId);
      if (dl && dl.controller) {
        dl.controller.abort();
      }
      return prev;
    });
  }, []);

  const removeDownload = useCallback((downloadId) => {
    setDownloads(prev => {
      const next = new Map(prev);
      const dl = next.get(downloadId);
      if (dl && dl.controller) {
        dl.controller.abort();
      }
      if (dl) {
        clearDownloadState(dl.fileId);
      }
      next.delete(downloadId);
      return next;
    });
  }, []);

  const clearDoneDownloads = useCallback(() => {
    setDownloads(prev => {
      const next = new Map(prev);
      for (const [id, dl] of next.entries()) {
        if (dl.status === 'done') {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  return (
    <DownloadContext.Provider value={{ 
      downloads, 
      queueDownload, 
      startDownload, 
      pauseDownload, 
      removeDownload, 
      clearDoneDownloads 
    }}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloadContext() {
  return useContext(DownloadContext);
}
