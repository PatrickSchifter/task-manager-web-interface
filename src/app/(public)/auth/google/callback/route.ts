import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setSessionToken } from "@/src/lib/auth/session";

/**
 * Callback do login social com Google.
 *
 * O backend Nest finaliza o handshake OAuth, assina o JWT e redireciona para
 * cá com `?token=<jwt>`. Aqui o token é gravado no cookie HttpOnly `auth_token`
 * (mesma sessão do login por senha) e o usuário segue para o dashboard.
 *
 * Esta rota precisa estar na allowlist do middleware: no momento do callback
 * ainda não existe cookie, então sem isso o middleware redirecionaria de volta
 * para /auth/login antes do token ser gravado.
 *
 * Usa Location RELATIVO (e não `new URL(..., request.url)`): o browser resolve
 * o destino contra o host público que ele de fato acessou. Assim o redirect não
 * depende do proxy repassar x-forwarded-host corretamente — evita cair em
 * localhost:3000 atrás do proxy reverso.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(null, {
      status: 307,
      headers: { Location: "/auth/login?error=oauth" },
    });
  }

  await setSessionToken(token);

  return new NextResponse(null, {
    status: 307,
    headers: { Location: "/dashboard" },
  });
}
