import { describe, it, expect } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import userEvent from "@testing-library/user-event";
import { render, screen, renderHook } from "@testing-library/react";
import { theme } from "@/src/theme";
import { FeedbackProvider, useFeedback } from "./feedback-provider";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <FeedbackProvider>{children}</FeedbackProvider>
    </ThemeProvider>
  );
}

describe("FeedbackProvider / useFeedback", () => {
  it("lança erro quando usado fora do provider", () => {
    expect(() => renderHook(() => useFeedback())).toThrow(
      /must be used within provider/,
    );
  });

  it("não exibe snackbar inicialmente", () => {
    render(<div>vazio</div>, { wrapper });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("exibe a mensagem quando show é chamado", async () => {
    function Trigger() {
      const { show } = useFeedback();
      return (
        <button type="button" onClick={() => show("Salvo com sucesso", "success")}>
          mostrar
        </button>
      );
    }

    render(<Trigger />, { wrapper });
    await userEvent.click(screen.getByRole("button", { name: "mostrar" }));

    expect(await screen.findByText("Salvo com sucesso")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
