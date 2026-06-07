import { ApiError } from "./api-error";

export function mapApiError(error: ApiError) {
  switch (error.statusCode) {
    case 400:
      return "Requisição inválida. Verifique os dados enviados";

    case 401:
      return "Sessão expirada. Faça login novamente";

    case 403:
      return "Você não tem permissão para realizar esta ação";

    case 404:
      return "Recurso não encontrado";

    case 409:
      return "Este registro já existe ou está em conflito com outro";

    case 422:
      return "Dados inválidos. Verifique as informações e tente novamente";

    case 429:
      return "Muitas tentativas. Aguarde alguns instantes e tente novamente";

    case 500:
      return "Erro interno. Tente novamente em instantes";

    case 502:
      return "Serviço temporariamente indisponível. Tente novamente em instantes";

    case 503:
      return "Serviço em manutenção. Tente novamente em breve";

    case 504:
      return "O servidor demorou muito para responder. Tente novamente";

    default:
      return error.message || "Erro inesperado";
  }
}
