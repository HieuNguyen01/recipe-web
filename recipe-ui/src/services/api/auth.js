import { request, setAuthToken } from "./client";

export async function register(credentials) {
  const { token } = await request("post", "/auth/register", credentials);
  setAuthToken(token);
  return token;
}

export async function login(credentials) {
  const { token, user } = await request("post", "/auth/login", credentials);
  setAuthToken(token);
  return { token, user };
}

// export async function getMe() {
//   const { data } = await request("get", "/user/me");
//   return data;
// }
