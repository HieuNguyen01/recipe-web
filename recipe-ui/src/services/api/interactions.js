import { request } from "./client";

export function likeRecipe(id) {
  return request("post", `/recipe/${id}/like`);
}

export function rateRecipe(id, value) {
  return request("post", `/recipe/${id}/rate`, { value });
}

export function getMyRating(id) {
  return request("get", `/recipe/${id}/rate`);
}
