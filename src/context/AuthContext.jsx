import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    try {
      const guardada = localStorage.getItem("bo-sesion");
      return guardada ? JSON.parse(guardada) : null;
    } catch {
      return null;
    }
  });

  async function ingresar(clave) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo ingresar");
    localStorage.setItem("bo-sesion", JSON.stringify(data));
    setSesion(data);
  }

  function salir() {
    localStorage.removeItem("bo-sesion");
    setSesion(null);
  }

  return (
    <AuthContext.Provider
      value={{
        rol: sesion?.rol || null,
        token: sesion?.token || null,
        esAdmin: sesion?.rol === "admin",
        ingresar,
        salir,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
