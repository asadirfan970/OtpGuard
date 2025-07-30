export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  admin?: User;
  user?: User;
}

let currentUser: User | null = null;

try {
  const userData = localStorage.getItem('currentUser');
  if (userData) {
    currentUser = JSON.parse(userData);
  }
} catch {
  currentUser = null;
}

export function setCurrentUser(user: User) {
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function clearAuth() {
  currentUser = null;
  localStorage.removeItem('currentUser');
}

export function isAuthenticated(): boolean {
  return !!currentUser;
}
