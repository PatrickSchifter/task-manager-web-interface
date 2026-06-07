"use client";

import { createContext, useContext } from "react";
import { UserItemListDTOWithAvatar } from "../services/api/auth.server.service";

const UserContext = createContext<UserItemListDTOWithAvatar | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: UserItemListDTOWithAvatar;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): UserItemListDTOWithAvatar {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
