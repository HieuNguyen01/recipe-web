import axios from "axios";

// 1) Create Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5500/api",
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use(config => {
  console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
  console.log("     Headers:", config.headers.Authorization);
  return config;
});

// 2) Manage the default Authorization header
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// 3) Low-level request helper.
//    Always returns response.data
async function request(method, url, data = null, config = {}) {
  const response = await api({ method, url, data, ...config });
  return response.data;
}

// 4) Public endpoints

// FETCH recipes (no pagination on server, client-side only)
export async function getRecipes({ title, ingredient } = {}) {
  const params = { ...(title && { title }), ...(ingredient && { ingredient }) };
  // server returns { recipes: [ ... ] }
  return request("get", "/recipe", null, { params });
}

export async function getRecipeById(id) {
  // server returns { success, message, data: {...} } or old shape
  return api.get(`/recipe/${id}`).then(res => res.data);
}

// AUTHENTICATION

export async function register(data) {
  // server returns { success, message, data: { token } }
  const { data: payload } = await api.post("/auth/register", data);
  const token = payload.token;
  setAuthToken(token);
  return payload;
}

export async function login(credentials) {
  const response = await api.post('/auth/login', credentials);
  // Return the nested data object so callers can do { token }
  return response.data.data;
}

// export async function login(credentials) {
//   // server returns { success, message, data: { token } }
//   const { data: payload } = await api.post("/auth/login", credentials);
//   const token = payload.token;
//   setAuthToken(token);
//   return payload;
// }

export async function getMe() {
  // server returns { success, message, data: { ...user } }
  const response = await api.get("/user/me");
  // if your server wraps user in response.data.data:
  return response.data.data;
}

// PROTECTED ENDPOINTS
// (these now all pick up the Authorization header automatically)

export function createRecipe(data) {
  return request("post", "/recipe", data);
}
export function updateRecipe(id, data) {
  return request("put", `/recipe/${id}`, data);
}
export function deleteRecipe(id) {
  return request("delete", `/recipe/${id}`);
}

export async function commentRecipe(recipeId, content) {
  const resp = await api.post(`/recipe/${recipeId}/comments`, { content });
  // server returns { success, message, data: { …comment }, meta:… }
  return resp.data.data;
}


export function likeRecipe(recipeId) {
  return request("post", `/recipe/${recipeId}/like`);
}

export function rateRecipe(recipeId, value) {
  return request("post", `/recipe/${recipeId}/rate`, { value });
}

export async function uploadAvatar(recipeId, dataUrl) {
  // headers already set globally via setAuthToken
  return request("post", `/recipe/${recipeId}/avatar`, { image: dataUrl });
}