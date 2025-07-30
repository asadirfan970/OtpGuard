export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  admin?: User;
  user?: User;
  token?: string;
}

let currentUser: User | null = null;

// Initialize from localStorage
try {
  const userData = localStorage.getItem('currentUser');
  const authToken = localStorage.getItem('authToken');
  
  if (userData && authToken) {
    currentUser = JSON.parse(userData);
  }
} catch {
  currentUser = null;
}

export function setCurrentUser(user: User, token?: string) {
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  if (token) {
    localStorage.setItem('authToken', token);
  }
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function clearAuth() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!currentUser && !!token;
}
