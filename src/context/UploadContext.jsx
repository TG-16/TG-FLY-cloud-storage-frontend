import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const UploadContext = createContext(null);

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_CONCURRENT_UPLOADS = 3; // Upload 3 chunks in parallel

function getUploadState(fileId) {
  try {
    const data = localStorage.getItem(`tgfly_upload_${fileId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveUploadState(fileId, state) {
  localStorage.setItem(`tgfly_upload_${fileId}`, JSON.stringify(state));
}

function clearUploadState(fileId) {
  localStorage.removeItem(`tgfly_upload_${fileId}`);
}

export function UploadProvider({ children }) {
  const [uploads, setUploads] = useState(new Map());
  const toast = useToast();

  // Rehydrate pending uploads on mount/auth
  useEffect(() => {
    const fetchPending = async () => {
      try {
        if (!api.getToken()) return;
        const res = await api.getPendingUploads();
        if (res.sessions && res.sessions.length > 0) {
          setUploads(prev => {
            const next = new Map(prev);
            res.sessions.forEach(session => {
              if (!next.has(session.file_id)) {
                next.set(session.file_id, {
                  id: session.file_id,
                  file: null, // File object is lost, user must re-select to resume
                  folderId: session.folder_id,
                  name: session.original_name,
                  size: session.size_mb * 1024 * 1024,
                  progress: 0,
                  status: 'paused',
                  error: 'Please re-select the file to resume upload.',
                  mimeType: 'application/octet-stream',
                  uploadId: session.s3_upload_id,
                  totalParts: session.total_parts
                });
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to fetch pending uploads', err);
      }
    };
    fetchPending();
  }, []);

  const updateUpload = useCallback((id, updates) => {
    setUploads(prev => {
      const next = new Map(prev);
      const current = next.get(id) || {};
      next.set(id, { ...current, ...updates });
      return next;
    });
  }, []);

  const queueFiles = useCallback((files, folderId = null) => {
    setUploads(prev => {
      const next = new Map(prev);
      for (const file of Array.from(files)) {
        // If file already exists as paused/pending (by name and roughly size), attach it
        let existingId = null;
        for (const [id, u] of next.entries()) {
          if (u.name === file.name && !u.file && (u.status === 'paused' || u.status === 'error')) {
            existingId = id;
            break;
          }
        }

        if (existingId) {
          const u = next.get(existingId);
          next.set(existingId, { ...u, file, error: null, status: 'paused' });
          toast.info(`Attached file to pending upload: ${file.name}`);
        } else {
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          next.set(tempId, {
            id: tempId,
            file,
            folderId,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'idle',
            error: null,
            mimeType: file.type,
            controller: null
          });
        }
      }
      return next;
    });
  }, [toast]);

  const uploadFile = useCallback(async (uploadId) => {
    let uploadData;
    setUploads(prev => {
      uploadData = prev.get(uploadId);
      return prev;
    });

    if (!uploadData || (uploadData.status !== 'idle' && uploadData.status !== 'paused' && uploadData.status !== 'error')) return;
    
    if (!uploadData.file) {
      toast.error('File missing! Please drag and drop the same file again to resume.');
      return;
    }

    const controller = new AbortController();
    const { file, folderId } = uploadData;
    updateUpload(uploadId, { status: 'initiating', error: null, controller });

    try {
      let s3UploadId = uploadData.uploadId;
      let activeId = uploadData.id;
      let totalParts = uploadData.totalParts || Math.ceil(file.size / CHUNK_SIZE);
      let completedParts = [];

      // 1. Initiate or Resume
      if (!s3UploadId) {
        const initRes = await api.initiateUpload(file.name, file.size, file.type, folderId);
        s3UploadId = initRes.uploadId;
        activeId = initRes.fileId;
        totalParts = initRes.totalParts;

        // Update ID from temp to real
        setUploads(prev => {
          const next = new Map(prev);
          const data = next.get(uploadId);
          next.delete(uploadId);
          next.set(activeId, {
            ...data,
            id: activeId,
            uploadId: s3UploadId,
            totalParts,
            controller
          });
          return next;
        });

        saveUploadState(activeId, { uploadId: s3UploadId, fileId: activeId, totalParts, completedParts: [], fileName: file.name });
      } else {
        updateUpload(activeId, { controller }); // update controller for resumed active ID
        // Fetch parts from backend for safe resume
        const partsRes = await api.getUploadParts(s3UploadId);
        completedParts = partsRes.completedParts || [];
        saveUploadState(activeId, { uploadId: s3UploadId, fileId: activeId, totalParts, completedParts, fileName: file.name });
      }

      updateUpload(activeId, { status: 'uploading' });

      // Identify pending parts
      const partsToUpload = [];
      for (let p = 1; p <= totalParts; p++) {
        if (!completedParts.find(cp => cp.PartNumber === p)) {
          partsToUpload.push(p);
        }
      }

      // Pre-fetch all URLs in one batch
      let presignedUrls = {};
      if (partsToUpload.length > 0) {
        const batchRes = await api.getPresignedUploadUrlBatch(s3UploadId, partsToUpload);
        presignedUrls = batchRes.urls;
      }

      // 2. Upload chunks in parallel with smooth progress
      let activeRequests = 0;
      let currentIndex = 0;
      let hasError = false;

      // Tracking bytes uploaded per chunk for smooth progress
      const partProgressBytes = new Map();
      let completedBytes = completedParts.length * CHUNK_SIZE; // Mutable total for completed parts
      let lastReportedProgress = 0; // High-water mark

      const calcProgress = () => {
        let currentActiveBytes = 0;
        for (const bytes of partProgressBytes.values()) {
          currentActiveBytes += bytes;
        }
        const totalUploaded = completedBytes + currentActiveBytes;
        let progress = Math.round((totalUploaded / file.size) * 100);
        
        // High-water mark: never go backwards
        if (progress > lastReportedProgress) {
          progress = Math.min(100, progress);
          lastReportedProgress = progress;
          updateUpload(activeId, { progress });
        }
      };

      const uploadNextChunk = async () => {
        if (hasError || controller.signal.aborted) return;
        
        if (currentIndex >= partsToUpload.length) return;

        const partNumber = partsToUpload[currentIndex++];
        activeRequests++;

        try {
          const presignedUrl = presignedUrls[partNumber];
          
          const start = (partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          // Upload via XHR for upload progress events
          const etag = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignedUrl);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                partProgressBytes.set(partNumber, e.loaded);
                calcProgress();
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                partProgressBytes.delete(partNumber);
                completedBytes += chunk.size; // Permanently add to completed total
                calcProgress(); // Update progress immediately
                resolve(xhr.getResponseHeader('ETag'));
              } else {
                reject(new Error(`Chunk ${partNumber} failed with status ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            
            controller.signal.addEventListener('abort', () => {
              xhr.abort();
              reject(new Error('Aborted'));
            });

            xhr.send(chunk);
          });

          completedParts.push({ PartNumber: partNumber, ETag: etag });
          saveUploadState(activeId, { uploadId: s3UploadId, fileId: activeId, totalParts, completedParts, fileName: file.name });
          
          activeRequests--;
          if (!hasError && !controller.signal.aborted) {
             await uploadNextChunk();
          }

        } catch (err) {
          activeRequests--;
          if (!controller.signal.aborted) {
            hasError = true;
            throw err;
          }
        }
      };

      const initialWorkers = [];
      for (let i = 0; i < MAX_CONCURRENT_UPLOADS; i++) {
        initialWorkers.push(uploadNextChunk());
      }
      
      await Promise.all(initialWorkers);

      if (controller.signal.aborted) {
        throw new Error('Aborted');
      }

      // 3. Complete upload
      updateUpload(activeId, { status: 'completing' });
      await api.completeUpload(s3UploadId, completedParts);

      clearUploadState(activeId);
      updateUpload(activeId, { status: 'done', progress: 100, controller: null });
      toast.success(`${file.name} uploaded successfully`);

      return activeId;
    } catch (err) {
      let currentId = uploadId;
      setUploads(prev => {
        if (!prev.has(currentId)) {
          const match = Array.from(prev.values()).find(u => u.name === file.name);
          if (match) currentId = match.id;
        }
        return prev;
      });

      if (err.message === 'Aborted') {
        updateUpload(currentId, { status: 'paused', controller: null });
        toast.info(`Paused upload: ${file.name}`);
      } else {
        updateUpload(currentId, { status: 'error', error: err.message || 'Upload failed', controller: null });
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
      }
    }
  }, [updateUpload, toast]);

  const pauseUpload = useCallback((uploadId) => {
    setUploads(prev => {
      const u = prev.get(uploadId);
      if (u && u.controller) {
        u.controller.abort();
      }
      return prev;
    });
  }, []);

  const removeUpload = useCallback((fileId) => {
    setUploads(prev => {
      const next = new Map(prev);
      const u = next.get(fileId);
      if (u && u.controller) {
        u.controller.abort();
      }
      
      // Attempt to abort from backend to cleanup S3 parts if not completed
      if (u && u.uploadId && u.status !== 'done') {
         api.abortUpload(u.uploadId).catch(() => {});
      }

      next.delete(fileId);
      return next;
    });
    clearUploadState(fileId);
  }, []);

  const clearDoneUploads = useCallback(() => {
    setUploads(prev => {
      const next = new Map(prev);
      for (const [id, upload] of next.entries()) {
        if (upload.status === 'done') {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  return (
    <UploadContext.Provider value={{ uploads, queueFiles, uploadFile, pauseUpload, removeUpload, clearDoneUploads }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadContext() {
  return useContext(UploadContext);
}
