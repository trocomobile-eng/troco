import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("troco_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const me = await api.me(token);
        setUser(me);
      } catch {
        localStorage.removeItem("troco_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });

    if (!data.token) {
      throw new Error(data.error || "Connexion impossible");
    }

    localStorage.setItem("troco_token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const signup = async (email, password, username) => {
    const data = await api.signup({ email, password, username });

    if (!data.token) {
      throw new Error(data.error || "Inscription impossible");
    }

    localStorage.setItem("troco_token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("troco_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}