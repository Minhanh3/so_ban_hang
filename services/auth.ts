import { AuthSession, AuthUser } from '../types';

type StoredUser = AuthUser & {
  passwordHash: string;
};

type AuthSuccess = {
  success: true;
  user?: AuthUser;
  session?: AuthSession;
  message?: string;
};

type AuthFailure = {
  success: false;
  message: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

const AUTH_USERS_KEY = 'sbh_auth_users';
const AUTH_SESSION_KEY = 'sbh_auth_session';
export const LEGACY_STORAGE_OWNER_KEY = 'sbh_legacy_storage_owner';

const encoder = new TextEncoder();

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeUsername = (username: string): string => username.trim().toLowerCase();
const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const hashPassword = async (password: string): Promise<string> => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return btoa(password);
};

const sanitizeUser = (user: StoredUser): AuthUser => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    email: safeUser.email || '',
  };
};

const getStoredUsers = (): StoredUser[] => readJson<StoredUser[]>(AUTH_USERS_KEY, []);

const saveUsers = (users: StoredUser[]): void => {
  writeJson(AUTH_USERS_KEY, users);
};

const buildSession = (user: AuthUser): AuthSession => ({
  userId: user.id,
  username: user.username,
  displayName: user.displayName,
  loggedInAt: new Date().toISOString(),
});

const setSession = (user: AuthUser): AuthSession => {
  const session = buildSession(user);
  writeJson(AUTH_SESSION_KEY, session);
  return session;
};

export const getCurrentSession = (): AuthSession | null => {
  const session = readJson<AuthSession | null>(AUTH_SESSION_KEY, null);
  if (!session?.userId) {
    return null;
  }
  return session;
};

export const getCurrentUserId = (): string | null => getCurrentSession()?.userId ?? null;

export const getScopedStorageKey = (baseKey: string, userId?: string | null): string => {
  if (!userId) {
    return baseKey;
  }
  return `${baseKey}__${userId}`;
};

export const getCurrentUser = (): AuthUser | null => {
  const session = getCurrentSession();
  if (!session) {
    return null;
  }

  const matchedUser = getStoredUsers().find((user) => user.id === session.userId);
  if (!matchedUser) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }

  return sanitizeUser(matchedUser);
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_SESSION_KEY);
};

export const register = async (input: {
  username: string;
  email: string;
  displayName: string;
  password: string;
}): Promise<AuthResult> => {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const password = input.password.trim();

  if (!username || !email || !displayName || !password) {
    return { success: false, message: 'Vui lòng nhập đầy đủ thông tin.' };
  }

  if (username.length > 12) {
    return { success: false, message: 'Tên đăng nhập tối đa 12 ký tự.' };
  }

  if (password.length < 6 || password.length > 10) {
    return { success: false, message: 'Mật khẩu phải từ 6 đến 10 ký tự.' };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, message: 'Email không đúng định dạng.' };
  }

  const users = getStoredUsers();
  const exists = users.some((user) => user.username === username);
  if (exists) {
    return { success: false, message: 'Tên đăng nhập đã tồn tại.' };
  }
  const emailExists = users.some((user) => normalizeEmail(user.email || '') === email);
  if (emailExists) {
    return { success: false, message: 'Email đã được sử dụng.' };
  }

  const now = new Date().toISOString();
  const newUser: StoredUser = {
    id: generateId(),
    username,
    email,
    displayName,
    createdAt: now,
    updatedAt: now,
    passwordHash: await hashPassword(password),
  };

  users.push(newUser);
  saveUsers(users);

  const safeUser = sanitizeUser(newUser);
  return {
    success: true,
    user: safeUser,
    message: 'Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.',
  };
};

export const login = async (input: {
  username: string;
  password: string;
}): Promise<AuthResult> => {
  const username = normalizeUsername(input.username);
  const password = input.password.trim();

  if (!username || !password) {
    return { success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' };
  }

  const users = getStoredUsers();
  const matchedIndex = users.findIndex((user) => user.username === username);
  if (matchedIndex === -1) {
    return { success: false, message: 'Tài khoản không tồn tại.' };
  }

  const expectedHash = await hashPassword(password);
  if (users[matchedIndex].passwordHash !== expectedHash) {
    return { success: false, message: 'Mật khẩu không đúng.' };
  }

  const updatedUser: StoredUser = {
    ...users[matchedIndex],
    lastLoginAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users[matchedIndex] = updatedUser;
  saveUsers(users);

  const safeUser = sanitizeUser(updatedUser);
  return {
    success: true,
    user: safeUser,
    session: setSession(safeUser),
  };
};

export const changePassword = async (input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  const currentPassword = input.currentPassword.trim();
  const newPassword = input.newPassword.trim();

  if (!currentPassword || !newPassword) {
    return { success: false, message: 'Vui lòng nhập đầy đủ mật khẩu.' };
  }

  const users = getStoredUsers();
  const matchedIndex = users.findIndex((user) => user.id === input.userId);
  if (matchedIndex === -1) {
    return { success: false, message: 'Không tìm thấy tài khoản.' };
  }

  const currentHash = await hashPassword(currentPassword);
  if (users[matchedIndex].passwordHash !== currentHash) {
    return { success: false, message: 'Mật khẩu hiện tại không đúng.' };
  }

  users[matchedIndex] = {
    ...users[matchedIndex],
    passwordHash: await hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  };
  saveUsers(users);

  return { success: true, message: 'Đã cập nhật mật khẩu thành công.' };
};

export const hydrateAuthState = (): { user: AuthUser | null; session: AuthSession | null } => {
  const session = getCurrentSession();
  const user = getCurrentUser();

  if (!session || !user) {
    return { user: null, session: null };
  }

  return { user, session };
};
