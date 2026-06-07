import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { UserProvider, useUser } from "./user-provider";
import { WorkspaceProvider, useWorkspace } from "./workspace-provider";
import {
  AuthStatusProvider,
  useIsAuthenticated,
} from "./auth-status-provider";

const user = { id: "u1", name: "Ana", email: "ana@b.com" } as never;

describe("UserProvider / useUser", () => {
  it("expõe o usuário dentro do provider", () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => (
        <UserProvider user={user}>{children}</UserProvider>
      ),
    });
    expect(result.current).toBe(user);
  });

  it("lança fora do provider", () => {
    expect(() => renderHook(() => useUser())).toThrow(
      /must be used within a UserProvider/,
    );
  });
});

describe("WorkspaceProvider / useWorkspace", () => {
  const projects = [{ id: "p1", name: "Proj" }] as never;

  it("expõe user e projects", () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: ({ children }) => (
        <WorkspaceProvider user={user} projects={projects}>
          {children}
        </WorkspaceProvider>
      ),
    });
    expect(result.current.user).toBe(user);
    expect(result.current.projects).toBe(projects);
  });

  it("lança fora do provider", () => {
    expect(() => renderHook(() => useWorkspace())).toThrow(
      /must be used within a WorkspaceProvider/,
    );
  });
});

describe("AuthStatusProvider / useIsAuthenticated", () => {
  it("retorna false por padrão (fora do provider)", () => {
    const { result } = renderHook(() => useIsAuthenticated());
    expect(result.current).toBe(false);
  });

  it("reflete o valor fornecido pelo provider", () => {
    const { result } = renderHook(() => useIsAuthenticated(), {
      wrapper: ({ children }) => (
        <AuthStatusProvider isAuthenticated>{children}</AuthStatusProvider>
      ),
    });
    expect(result.current).toBe(true);
  });
});
