// src/services/api.js
import axios from "axios";

// 1. Create an axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5500/api",
  headers: { "Content-Type": "application/json" }
});

// 2. Utility to set/remove auth token
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// 3. Lightweight request wrapper
//    method: 'get' | 'post' | 'put' | 'delete', etc.
//    url: endpoint path (e.g. '/recipe')
//    data: request body for POST/PUT
//    config: additional axios config (e.g. { params })
function request(method, url, data = null, config = {}) {
  return api({ method, url, data, ...config }).then(response => response.data);
}

// 4. Public endpoints
export function getRecipes({ page = 1, limit = 3, title, ingredient } = {}) {
  const params = { page, limit, ...(title && { title }), ...(ingredient && { ingredient }) };
  return request("get", "/recipe", null, { params });
}

// fetch single recipe by id
export function getRecipeById(id) {
  return api.get(`/recipe/${id}`).then((res) => res.data);
}

export function register(data) {
  return request("post", "/auth/register", data);
}

export function login(credentials) {
  return request("post", "/auth/login", credentials);
}

export function getMe() {
  return request("get", "/user/me");
}

// 5. Protected endpoints (call setAuthToken first)
export function createRecipe(data) {
  return request("post", "/recipe", data);
}

export function updateRecipe(id, data) {
  return request("put", `/recipe/${id}`, data);
}

export function deleteRecipe(id) {
  return request("delete", `/recipe/${id}`);
}

export function commentRecipe(recipeId, content) {
  return api.post(`/recipe/${recipeId}/comments`, { content });
}

export function likeRecipe(recipeId) {
  return request("post", `/recipe/${recipeId}/like`,{});
}
