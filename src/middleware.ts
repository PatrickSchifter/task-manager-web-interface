import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Rotas que qualquer pessoa pode acessar sem autenticação. */
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/google/callback",
  "/privacy",
  "/terms",
  "/security",
  "/contact",
];

/** Prefixos que sempre são públicos (assets, api routes internas, etc). */
const PUBLIC_PREFIXES = ["/_next", "/favicon", "/api/public"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return PUBLIC_ROUTES.includes(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Deixa passar recursos estáticos e rotas públicas
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  // Sem token → redireciona para login mantendo a URL de destino
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token presente → deixa seguir
  return NextResponse.next();
}

export const config = {
  /*
   * Aplica o middleware em todas as rotas exceto:
   * - arquivos estáticos do Next (_next/static, _next/image)
   * - ícones/imagens na raiz
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
