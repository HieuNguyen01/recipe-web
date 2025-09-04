import { request } from "./client";

export async function getUnits() {
  const { units, data } = await request("get", "/recipe/units");
  // normal shape:   { units: [...]} or { data: [...] } or [...]
  return Array.isArray(units)
    ? units
    : Array.isArray(data)
      ? data
      : Array.isArray(units || data)
        ? units || data
        : [];
}

export async function getRecipes({ title, ingredient } = {}) {
  const params = {
    ...(title      && { title }),
    ...(ingredient && { ingredient })
  };

  // server responds: { recipes: [...] }
  const { recipes } = await request("get", "/recipe", null, { params });
  return recipes;
}

export function getRecipeById(id) {
  return request("get", `/recipe/${id}`);
}

export function createRecipe(payload) {
  return request("post", "/recipe", payload);
}

export function updateRecipe(id, payload) {
  return request("put", `/recipe/${id}`, payload);
}

export function deleteRecipe(id) {
  return request("delete", `/recipe/${id}`);
}
