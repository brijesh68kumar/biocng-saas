const TOKEN_KEY = 'biocng_token';
const USER_KEY = 'biocng_user';

// Persist auth session locally so browser refresh does not log user out.
export const authStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

