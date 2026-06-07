"use client";

import { createContext, useContext } from "react";

const AuthStatusContext = createContext<boolean>(false);

/**
 * Disponibiliza o estado de autenticação (derivado do cookie HttpOnly no
 * servidor) para componentes client, como o Logo, decidirem o destino correto.
 */
export function AuthStatusProvider({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: React.ReactNode;
}) {
  return (
    <AuthStatusContext.Provider value={isAuthenticated}>
      {children}
    </AuthStatusContext.Provider>
  );
}

/** Retorna `true` quando há sessão ativa. */
export function useIsAuthenticated(): boolean {
  return useContext(AuthStatusContext);
}
