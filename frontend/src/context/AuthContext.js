import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to restore session from storage (implement if needed)
        // For now, just set loading to false
        setIsLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const payload = await authService.login(email, password);
    const user = payload?.user || null;

    if (!user) {
      throw new Error("Login failed");
    }

    setCurrentUser(user);
    setAccessToken(payload.access_token || null);
    return user;
  };

  const logout = async () => {
    setCurrentUser(null);
    setAccessToken(null);
  };

  const value = useMemo(
    () => ({
      currentUser,
      accessToken,
      isLoading,
      login,
      logout,
    }),
    [currentUser, accessToken, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
