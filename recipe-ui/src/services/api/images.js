// src/services/api/images.js
import { request } from "./client";

// if you upload base64 strings
export function uploadRecipeImage(id, dataUrl) {
  return request(
    "post", 
    `/recipe/${id}/image`, 
    { image: dataUrl },
    );
}

// if you want real file uploads (preferred):
export function uploadRecipeFile(id, file) {
  const form = new FormData();
  form.append("image", file);
  return request("post", `/recipe/${id}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function fetchRecipeImage(id) {
  return request("get", `/recipe/${id}/image`, null, {
    responseType: "blob",
  });
}

// Returns { image: "<data-uri>" }
export function getRecipeImageDataUri(id) {
  return request("get", `/recipe/${id}/image`);
}
