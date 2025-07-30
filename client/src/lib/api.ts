class ApiClient {
  async updateScript(id: string, updates: any) {
    return this.request(`/admin/scripts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  private baseUrl = '/api';

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add JWT token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include session cookies for development fallback
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Auth
  async loginAdmin(email: string, password: string) {
    return this.request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Stats
  async getStats() {
    return this.request('/admin/stats');
  }

  // Users
  async getUsers() {
    return this.request('/admin/users');
  }

  async createUser(userData: { email: string; password: string }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, updates: any) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Countries
  async getCountries() {
    return this.request('/countries');
  }

  async createCountry(countryData: { name: string; code: string; numberLength: number }) {
    return this.request('/admin/countries', {
      method: 'POST',
      body: JSON.stringify(countryData),
    });
  }

  async updateCountry(id: string, updates: any) {
    return this.request(`/admin/countries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCountry(id: string) {
    return this.request(`/admin/countries/${id}`, {
      method: 'DELETE',
    });
  }

  // Scripts
  async getScripts() {
    return this.request('/scripts');
  }

  async uploadScript(appName: string, file: File) {
    const formData = new FormData();
    formData.append('appName', appName);
    formData.append('file', file);

    const headers: Record<string, string> = {};
    
    // Add JWT token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/admin/scripts`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  async deleteScript(id: string) {
    return this.request(`/admin/scripts/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks() {
    return this.request('/admin/tasks');
  }
}

export const api = new ApiClient();
