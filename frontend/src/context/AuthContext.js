import { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from "react";
import { authService, decodeJwtPayload } from "../services/authService";
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
  const expiryTimeoutRef = useRef(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser=await AsyncStorage.getItem("currentUser");
        const storedToken=await AsyncStorage.getItem("accessToken");
        if(storedUser && storedToken){
          const parsedUser = JSON.parse(storedUser);

          // Validate token expiry
          const payload = decodeJwtPayload(storedToken);
          if (payload?.exp && Date.now() / 1000 >= payload.exp) {
            // token expired - clear stored auth
            await AsyncStorage.multiRemove(["currentUser", "accessToken"]);
            setCurrentUser(null);
            setAccessToken(null);
            setProfileImage(null);
            return;
          }

          setCurrentUser(parsedUser);
          setProfileImage(parsedUser?.pfp || null);
          setAccessToken(storedToken);

          // Schedule automatic logout when token expires
          scheduleTokenExpiry(storedToken);

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

      if (payload?.requires_totp) {
        return payload;
      }

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
      // Schedule automatic logout when token expires
      scheduleTokenExpiry(token);
      return user;
    }catch(err){
      console.error("Auth Login Error: ", err);
      throw err;
    }
  };

  const completeLogin = async (access_token, email) => {
    const tokenParts = String(access_token || "").split(".");
    let payload = {};
    if (tokenParts.length === 3) {
      try {
        const normalized = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        payload = JSON.parse(globalThis.atob(padded));
      } catch {}
    }
    const user = { id: payload?.id, role: payload?.role || "park_guide", personal_email: email };
    await AsyncStorage.setItem("currentUser", JSON.stringify(user));
    await AsyncStorage.setItem("accessToken", access_token);
    setAccessToken(access_token);
    setCurrentUser(user);
    return user;
  };

  const logout = useCallback(async () => {
    clearExpiryTimer();
    await AsyncStorage.multiRemove(["currentUser", "accessToken"]);
    setCurrentUser(null);
    setAccessToken(null);
    setProfileImage(null);
  }, [clearExpiryTimer]);

  const scheduleTokenExpiry = useCallback(
    (token) => {
      try {
        const payload = decodeJwtPayload(token);
        const exp = payload?.exp;
        if (!exp) return;

        const msUntilExpiry = exp * 1000 - Date.now();
        if (msUntilExpiry <= 0) {
          // Token already expired
          logout();
          return;
        }

        clearExpiryTimer();
        expiryTimeoutRef.current = setTimeout(() => {
          logout();
        }, msUntilExpiry);
      } catch (err) {
        console.error("Error scheduling token expiry:", err);
      }
    },
    [logout, clearExpiryTimer],
  );

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
      completeLogin,
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
