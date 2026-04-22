import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthSession, AuthUser } from '../../types';
import {
  AuthResult,
  changePassword as changePasswordRequest,
  hydrateAuthState,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../../services/auth';

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

type AuthContextType = {
  user: AuthUser | null;
  session: AuthSession | null;
  isReady: boolean;
  login: (input: { username: string; password: string }) => Promise<AuthResult>;
  register: (input: { username: string; email: string; displayName: string; password: string }) => Promise<AuthResult>;
  logout: () => void;
  changePassword: (input: ChangePasswordInput) => Promise<{ success: boolean; message: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialState = hydrateAuthState();
    setUser(initialState.user);
    setSession(initialState.session);
    setIsReady(true);
  }, []);

  const handleAuthResult = (result: AuthResult): AuthResult => {
    if (result.success && result.user && result.session) {
      setUser(result.user);
      setSession(result.session);
    }
    return result;
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    isReady,
    login: async (input) => handleAuthResult(await loginRequest(input)),
    register: async (input) => await registerRequest(input),
    logout: () => {
      logoutRequest();
      setUser(null);
      setSession(null);
    },
    changePassword: async (input) => {
      if (!user) {
        return { success: false, message: 'Bạn cần đăng nhập trước.' };
      }
      return changePasswordRequest({
        userId: user.id,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
    },
  }), [isReady, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
