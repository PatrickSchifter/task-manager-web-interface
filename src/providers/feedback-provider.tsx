"use client";

import { createContext, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

type FeedbackType = "success" | "error" | "info" | "warning";

type FeedbackState = {
  message: string;
  type: FeedbackType;
  open: boolean;
};

type FeedbackContextType = {
  show: (message: string, type?: FeedbackType) => void;
};

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FeedbackState>({
    message: "",
    type: "info",
    open: false,
  });

  const show = (message: string, type: FeedbackType = "info") => {
    setState({ message, type, open: true });
  };

  const handleClose = () => {
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <FeedbackContext.Provider value={{ show }}>
      {children}

      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={state.type} variant="filled">
          {state.message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within provider");
  return ctx;
}
