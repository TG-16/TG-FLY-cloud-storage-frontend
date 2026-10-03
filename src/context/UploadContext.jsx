import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const UploadContext = createContext(null);

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

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
  const [uploads, setUploads] = useState(new Map()); // id -> { file, progress, status, name, ... }
  const toast = useToast();

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
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        next.set(tempId, {
          id: tempId,
          file,
          folderId,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'idle', // 'idle', 'initiating', 'uploading', 'completing', 'done', 'error'
          error: null,
          mimeType: file.type
        });
      }
      return next;
    });
  }, []);

  const uploadFile = useCallback(async (uploadId) => {
    let uploadData;
    setUploads(prev => {
      uploadData = prev.get(uploadId);
      return prev;
    });

    if (!uploadData || uploadData.status !== 'idle') return;

    const { file, folderId } = uploadData;
    updateUpload(uploadId, { status: 'initiating', error: null });

    try {
      // 1. Initiate multipart upload
      const initRes = await api.initiateUpload(file.name, file.size, file.type, folderId);
      const { uploadId: s3UploadId, fileId, totalParts } = initRes;

      // Update ID to real fileId
      setUploads(prev => {
        const next = new Map(prev);
        const data = next.get(uploadId);
        next.delete(uploadId);
        next.set(fileId, {
          ...data,
          id: fileId,
          status: 'uploading',
          uploadId: s3UploadId,
          totalParts,
        });
        return next;
      });

      const activeId = fileId;

      // Save initial state
      saveUploadState(activeId, {
        uploadId: s3UploadId,
        fileId: activeId,
        totalParts,
        completedParts: [],
        fileName: file.name,
      });

      // 2. Upload chunks
      const completedParts = [];
      const savedState = getUploadState(activeId);
      const alreadyDone = savedState?.completedParts || [];

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        // Skip already completed parts
        if (alreadyDone.find(p => p.PartNumber === partNumber)) {
          completedParts.push(alreadyDone.find(p => p.PartNumber === partNumber));
          const progress = Math.round((partNumber / totalParts) * 100);
          updateUpload(activeId, { progress });
          continue;
        }

        // Get presigned URL
        const presignRes = await api.getPresignedUploadUrl(s3UploadId, partNumber);

        // Slice chunk from file
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Upload chunk directly to S3
        const uploadRes = await fetch(presignRes.presignedUrl, {
          method: 'PUT',
          body: chunk,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });

        if (!uploadRes.ok) {
          throw new Error(`Chunk ${partNumber} upload failed`);
        }

        const etag = uploadRes.headers.get('ETag');
        const part = { PartNumber: partNumber, ETag: etag };
        completedParts.push(part);

        // Save state after each chunk
        saveUploadState(activeId, {
          uploadId: s3UploadId,
          fileId: activeId,
          totalParts,
          completedParts,
          fileName: file.name,
        });

        const progress = Math.round((partNumber / totalParts) * 100);
        updateUpload(activeId, { progress });
      }

      // 3. Complete upload
      updateUpload(activeId, { status: 'completing' });
      await api.completeUpload(s3UploadId, completedParts);

      clearUploadState(activeId);
      updateUpload(activeId, { status: 'done', progress: 100 });
      toast.success(`${file.name} uploaded successfully`);

      return activeId;
    } catch (err) {
      // Find the current ID (might still be tempId or fileId)
      let currentId = uploadId;
      setUploads(prev => {
        if (!prev.has(currentId)) {
          // If not found by tempId, find by name
          const match = Array.from(prev.values()).find(u => u.name === file.name);
          if (match) currentId = match.id;
        }
        return prev;
      });

      updateUpload(currentId, {
        status: 'error',
        error: err.message || 'Upload failed',
      });
      toast.error(`Failed to upload ${file.name}: ${err.message}`);
      throw err;
    }
  }, [updateUpload, toast]);

  const removeUpload = useCallback((fileId) => {
    setUploads(prev => {
      const next = new Map(prev);
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
    <UploadContext.Provider value={{ uploads, queueFiles, uploadFile, removeUpload, clearDoneUploads }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadContext() {
  return useContext(UploadContext);
}
