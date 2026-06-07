import { createTheme, Shadows } from "@mui/material/styles";

const defaultShadows = createTheme().shadows;

export const shadows = [...defaultShadows] as Shadows;

shadows[1] = "0 0 4px rgba(56,130,246,.15)";
shadows[2] = "0 0 8px rgba(56,130,246,.20)";
shadows[3] = "0 0 16px rgba(56,130,246,.28)";
shadows[4] = "0 0 24px rgba(56,130,246,.35)";
shadows[5] = "0 0 32px rgba(56,130,246,.45)";
shadows[6] = "0 0 40px rgba(56,130,246,.55)";
