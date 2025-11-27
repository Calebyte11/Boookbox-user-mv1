// Generic fetch wrapper using Fetch API
export async function fetcher<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ""; ====== THE orignal ======
  const baseUrl = "https://boookbox-backend-cpvu.onrender.com"; // ====== for development ======

  const response = await fetch(`${baseUrl}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    const message =
      (data && (data as { message?: string }).message) || response.statusText;
    throw new Error(message);
  }
  return data;
}

// HTTP helpers
export const get = <T>(url: string) => fetcher<T>(url);
export const post = <T, B>(url: string, body: B) =>
  fetcher<T>(url, { method: "POST", body: JSON.stringify(body) });
export const put = <T, B>(url: string, body: B) =>
  fetcher<T>(url, { method: "PUT", body: JSON.stringify(body) });
export const del = <T>(url: string) => fetcher<T>(url, { method: "DELETE" });
