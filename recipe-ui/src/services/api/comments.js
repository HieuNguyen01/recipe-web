import { request } from "./client";

export async function commentRecipe(id, content) {
  const { data } = await request("post", `/recipe/${id}/comments`, { content });
  return data;
}
