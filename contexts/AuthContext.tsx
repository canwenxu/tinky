import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simple test version to make sure imports work
interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, username: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user] = useState(null);
  const [loading] = useState(false);

  const signIn = async (email: string, password: string) => {
    return { data: null, error: null };
  };

  const signUp = async (email: string, password: string, username: string) => {
    return { data: null, error: null };
  };

  const signOut = async () => {
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};