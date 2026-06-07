import { createTheme } from "@mui/material/styles";

import { palette } from "./palette";
import { typography } from "./typography";
import { components } from "./components";
import { shadows } from "./shadows";

export const theme = createTheme({
  palette,
  typography,
  components,
  shadows,
  shape: {
    borderRadius: 4,
  },
});
