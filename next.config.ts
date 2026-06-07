import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Otimização de memória do build ──────────────────────────────────────
  // O servidor de produção tem pouca RAM (1GB real + 1GB de swap em HD).
  // As opções abaixo reduzem o pico de memória do `next build`.

  // Não roda o type-check durante o build (tsc é o processo que mais consome
  // memória). A verificação roda no GitHub Actions, no runner com RAM
  // sobrando, antes do deploy — então nada passa sem validação.
  // (No Next 16 o ESLint já não roda mais no `next build`, então não há
  //  nada a desligar aqui pra isso.)
  typescript: { ignoreBuildErrors: true },

  // Não gera source maps do browser em produção (menos memória e disco).
  productionBrowserSourceMaps: false,

  experimental: {
    // Reduz o uso máximo de memória do webpack durante o build.
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
