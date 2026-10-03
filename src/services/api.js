const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('tgfly_token');
  }

  setToken(token) {
    localStorage.setItem('tgfly_token', token);
  }

  clearToken() {
    localStorage.removeItem('tgfly_token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Try refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        return this.handleResponse(retryResponse);
      }
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    return this.handleResponse(response);
  }

  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        this.setToken(data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ─── Auth ───────────────────────────────────────
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async signup(name, email, password) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  getGoogleAuthUrl() {
    return `${this.baseUrl}/auth/google`;
  }

  // ─── Files ──────────────────────────────────────
  async getFiles(folderId = null) {
    const query = folderId ? `?folderId=${folderId}` : '';
    return this.request(`/files${query}`);
  }

  async searchFiles(query) {
    return this.request(`/files/search?q=${encodeURIComponent(query)}`);
  }

  async deleteFile(fileId) {
    return this.request(`/files/${fileId}`, { method: 'DELETE' });
  }

  // ─── Folders ────────────────────────────────────
  async getFolders(parentId = null) {
    const query = parentId ? `?parentId=${parentId}` : '';
    return this.request(`/folders${query}`);
  }

  async createFolder(name, parentId = null) {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    });
  }

  async deleteFolder(folderId) {
    return this.request(`/folders/${folderId}`, { method: 'DELETE' });
  }

  async getFolderPath(folderId) {
    return this.request(`/folders/${folderId}/path`);
  }

  // ─── Upload (Multipart Resumable) ───────────────
  async initiateUpload(fileName, fileSize, mimeType, folderId = null) {
    return this.request('/upload/initiate', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileSize, mimeType, folderId }),
    });
  }

  async getPresignedUploadUrl(uploadId, partNumber) {
    return this.request('/upload/presign', {
      method: 'POST',
      body: JSON.stringify({ uploadId, partNumber }),
    });
  }

  async getPresignedUploadUrlBatch(uploadId, partNumbers) {
    return this.request('/upload/presign-batch', {
      method: 'POST',
      body: JSON.stringify({ uploadId, partNumbers }),
    });
  }

  async completeUpload(uploadId, parts) {
    return this.request('/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ uploadId, parts }),
    });
  }

  async getUploadParts(uploadId) {
    return this.request(`/upload/${uploadId}/parts`);
  }

  async abortUpload(uploadId) {
    return this.request(`/upload/${uploadId}`, { method: 'DELETE' });
  }

  async getPendingUploads() {
    return this.request('/upload/pending');
  }

  // ─── Download ───────────────────────────────────
  async getDownloadUrl(fileId) {
    return this.request(`/download/${fileId}`);
  }

  // ─── Plans ──────────────────────────────────────
  async getPlans() {
    return this.request('/plans');
  }

  async requestPlanUpgrade(planId, customGb, bankRef) {
    return this.request('/plans/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId, customGb, bankRef }),
    });
  }

  // ─── Dashboard ──────────────────────────────────
  async getUserDashboard() {
    return this.request('/dashboard');
  }

  // ─── Admin ──────────────────────────────────────
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAdminUsers(page = 1, search = '') {
    return this.request(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
  }

  async resetUserPassword(userId, newPassword) {
    return this.request(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async revokeUser(userId, reason) {
    return this.request(`/admin/users/${userId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async restoreUser(userId) {
    return this.request(`/admin/users/${userId}/restore`, {
      method: 'POST',
    });
  }

  async getPaymentRequests(status = 'pending') {
    return this.request(`/admin/payments?status=${status}`);
  }

  async confirmPayment(paymentId) {
    return this.request(`/admin/payments/${paymentId}/confirm`, { method: 'POST' });
  }

  async rejectPayment(paymentId) {
    return this.request(`/admin/payments/${paymentId}/reject`, { method: 'POST' });
  }

  async getEventLogs(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    return this.request(`/admin/logs?${params}`);
  }
}

const api = new ApiService();
export default api;
