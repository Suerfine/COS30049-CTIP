import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);
let logoutHandler = null;

export const registerLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const clearLogoutHandler = () => {
  logoutHandler = null;
};

export const triggerLogout = async () => {
  if (typeof logoutHandler === "function") {
    await logoutHandler();
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser=await AsyncStorage.getItem("currentUser");
        const storedToken=await AsyncStorage.getItem("accessToken");
        if(storedUser && storedToken){
          const parsedUser = JSON.parse(storedUser);

          setCurrentUser(parsedUser);
          setProfileImage(parsedUser?.pfp || null);
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
    try{
      await AsyncStorage.clear();
      const payload=await authService.login(email,password);
      const user=payload?.user || null;
      const token=payload?.access_token || null;
      if (!user || !token) {
        throw new Error("Login failed: Missing user data or token");
      }
      await AsyncStorage.setItem("currentUser", JSON.stringify(user));
      await AsyncStorage.setItem("accessToken", token);
      setAccessToken(token);
      setCurrentUser(user);
      setProfileImage(user?.pfp || null);
      return user;
    }catch(err){
      console.error("Auth Login Error: ", err);
      throw err;
    }
  };

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(["currentUser", "accessToken"]);
    setCurrentUser(null);
    setAccessToken(null);
    setProfileImage(null);
  }, []);

  useEffect(() => {
    registerLogoutHandler(logout);
    return () => {
      clearLogoutHandler();
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      currentUser,
      accessToken,
      isLoading,
      profileImage,
      setProfileImage,
      login,
      logout,
    }),
    [currentUser, accessToken, isLoading, profileImage],
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
