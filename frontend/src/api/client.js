const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  
  // Inject tokens from localStorage if they exist
  const token = localStorage.getItem("authToken");
  const headers = { 
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (path, params = {}, options = {}) => {
    const queryString = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))
    ).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;
    return request(fullPath, { ...options, method: "GET" });
  },

  post: (path, body, options = {}) => {
    const isUrlEncoded = body instanceof URLSearchParams;
    
    return request(path, {
      ...options,
      method: "POST",
      headers: { 
        "Content-Type": isUrlEncoded ? "application/x-www-form-urlencoded" : "application/json",
        ...options.headers 
      },
      body: isUrlEncoded ? body : JSON.stringify(body),
    });
  },

  postForm: (path, formData, options = {}) => {
    return request(path, {
      ...options,
      method: "POST",
      body: formData,
    });
  },

  delete: (path, options = {}) => {
    return request(path, {
      ...options,
      method: "DELETE",
    });
  },
};
