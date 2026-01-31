"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

// Simple password protection - only this password works
const CORRECT_PASSWORD = "hypecut2025";
const STORAGE_KEY = "james_os_auth";

interface User {
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check for stored auth on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.authenticated) {
          setUser({
            email: "adriano.neps@gmail.com",
            displayName: "Adriano",
            photoURL: undefined,
          });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
    if (!loading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  const signIn = async (password: string): Promise<boolean> => {
    setError(null);
    
    if (password === CORRECT_PASSWORD) {
      const userData = {
        email: "adriano.neps@gmail.com",
        displayName: "Adriano",
        photoURL: undefined,
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ authenticated: true }));
      return true;
    } else {
      setError("Incorrect password. Try again.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
