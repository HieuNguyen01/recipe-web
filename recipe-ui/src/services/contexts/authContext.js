import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken } from "services/api/client";

const AuthContext = createContext({ user: null, token: null, login: ()=>{}, logout: ()=>{} });

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    const u = sessionStorage.getItem("user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      setAuthToken(t);
    }
  }, []);

  const login = ({ token, user }) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
    setAuthToken(token);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
