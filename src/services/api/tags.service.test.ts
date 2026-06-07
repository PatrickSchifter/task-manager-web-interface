import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
const del = vi.fn();
const getServerApi = vi.fn();

vi.mock("@/src/services/api/api-server", () => ({
  getServerApi: () => getServerApi(),
}));

import { tagsService } from "./tags.service";

beforeEach(() => {
  get.mockReset().mockResolvedValue([]);
  post.mockReset().mockResolvedValue({ id: "1", name: "x", color: "brand" });
  del.mockReset().mockResolvedValue(undefined);
  getServerApi.mockReset().mockResolvedValue({ get, post, delete: del });
});

describe("tagsService", () => {
  it("findAll busca GET /v1/tags", async () => {
    get.mockResolvedValue([{ id: "1", name: "frontend", color: "brand" }]);
    const result = await tagsService.findAll();
    expect(get).toHaveBeenCalledWith("/v1/tags");
    expect(result).toEqual([{ id: "1", name: "frontend", color: "brand" }]);
  });

  it("create envia POST /v1/tags com o DTO", async () => {
    const dto = { name: "nova", color: "amber" as const };
    await tagsService.create(dto);
    expect(post).toHaveBeenCalledWith("/v1/tags", dto);
  });

  it("delete envia DELETE /v1/tags/:id", async () => {
    await tagsService.delete("tag-42");
    expect(del).toHaveBeenCalledWith("/v1/tags/tag-42");
  });
});
