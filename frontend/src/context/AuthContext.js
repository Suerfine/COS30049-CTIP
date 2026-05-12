import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { authService } from "../services/authService";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser=await AsyncStorage.getItem("currentUser");
        const storedToken=await AsyncStorage.getItem("accessToken");
        const storedMustChange=await AsyncStorage.getItem("mustChangePassword");
        if(storedUser && storedToken){
          setCurrentUser(JSON.parse(storedUser));
          setAccessToken(storedToken);
          setMustChangePassword(storedMustChange === "true");

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
    try{
      await AsyncStorage.clear();
      const payload=await authService.login(email,password);
      const user=payload?.user || null;
      const token=payload?.access_token || null;
      const mustChange=payload?.must_change_password ?? false;
      if (!user || !token) {
        throw new Error("Login failed: Missing user data or token");
      }
      await AsyncStorage.setItem("currentUser", JSON.stringify(user));
      await AsyncStorage.setItem("accessToken", token);
      await AsyncStorage.setItem("mustChangePassword", mustChange ? "true" : "false");
      setAccessToken(token);
      setCurrentUser(user);
      setMustChangePassword(mustChange);
      return user;
    }catch(err){
      console.error("Auth Login Error: ", err);
      throw err;
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["currentUser", "accessToken", "mustChangePassword"]);
    setCurrentUser(null);
    setAccessToken(null);
    setMustChangePassword(false);
  };

  const clearMustChangePassword = async () => {
    await AsyncStorage.setItem("mustChangePassword", "false");
    setMustChangePassword(false);
  };

  const value = useMemo(
    () => ({
      currentUser,
      accessToken,
      isLoading,
      mustChangePassword,
      login,
      logout,
      clearMustChangePassword,
    }),
    [currentUser, accessToken, isLoading, mustChangePassword],
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
