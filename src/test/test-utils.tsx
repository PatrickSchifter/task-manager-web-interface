import type { ReactElement, ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { render, type RenderOptions } from "@testing-library/react";
import { theme } from "@/src/theme";
import { FeedbackProvider } from "@/src/providers/feedback-provider";
import { AuthStatusProvider } from "@/src/providers/auth-status-provider";

type ProvidersProps = {
  children: ReactNode;
  /** Estado de autenticação exposto pelo AuthStatusProvider. */
  authenticated?: boolean;
};

/**
 * Envolve componentes com o tema real do MUI e os providers de contexto que a
 * maioria dos componentes client espera (feedback/snackbar e status de auth).
 */
export function AllProviders({ children, authenticated = false }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <AuthStatusProvider isAuthenticated={authenticated}>
        <FeedbackProvider>{children}</FeedbackProvider>
      </AuthStatusProvider>
    </ThemeProvider>
  );
}

type CustomRenderOptions = Omit<RenderOptions, "wrapper"> & {
  authenticated?: boolean;
};

/** `render` do RTL já embrulhado nos providers da aplicação. */
export function renderWithProviders(
  ui: ReactElement,
  { authenticated, ...options }: CustomRenderOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders authenticated={authenticated}>{children}</AllProviders>
    ),
    ...options,
  });
}

export * from "@testing-library/react";
export { renderWithProviders as render };
