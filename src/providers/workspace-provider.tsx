"use client";

import { createContext, useContext } from "react";
import type { components } from "@/src/types/api";
import { UserItemListDTOWithAvatar } from "../services/api/auth.server.service";

type ProjectItemListDTO = components["schemas"]["ProjectItemListDTO"];

interface WorkspaceContext {
  user: UserItemListDTOWithAvatar;
  projects: ProjectItemListDTO[];
}

const WorkspaceContext = createContext<WorkspaceContext | null>(null);

export function WorkspaceProvider({
  user,
  projects,
  children,
}: {
  user: UserItemListDTOWithAvatar;
  projects: ProjectItemListDTO[];
  children: React.ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={{ user, projects }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContext {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
