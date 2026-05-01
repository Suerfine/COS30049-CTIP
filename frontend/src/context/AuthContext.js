import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { authService } from "../services/authService";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser=await AsyncStorage.getItem("currentUser");
        const storedToken=await AsyncStorage.getItem("accessToken");
        if(storedUser && storedToken){
          setCurrentUser(JSON.parse(storedUser));
          setAccessToken(storedToken);

          if(typeof document !== "undefined"){
            document.title="SFC";
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      }finally{
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const payload = await authService.login(email, password);
    const user = payload?.user || null;
    const token=payload?.access_token || null;

    if (!user) {
      throw new Error("Login failed");
    }

    setCurrentUser(user);
    setAccessToken(token);

    await AsyncStorage.setItem("currentUser", JSON.stringify(user));
    await AsyncStorage.setItem("accessToken", token);
    return user;
  };

  const logout = async () => {
    setCurrentUser(null);
    setAccessToken(null);

    await AsyncStorage.removeItem("currentUser");
    await AsyncStorage.removeItem("accessToken");
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
