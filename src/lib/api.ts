export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.a3slabs.co.ke/api"
const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

export type ApiOptions = {
  headers?: HeadersInit
  query?: Record<string, string | number | boolean | undefined>
  body?: any
  auth?: boolean
  responseType?: "json" | "text" | "blob"
}

function buildUrl(path: string, query?: ApiOptions["query"]) {
  const base = API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`
  const url = new URL(path.replace(/^\/+/, ""), base)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export function getAccessToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken?: string | null) {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const url = buildUrl("refresh", { refresh_token: refreshToken })
    const res = await fetch(url, { method: "POST", credentials: "include" })
    if (!res.ok) {
      clearTokens()
      return null
    }
    const data = await res.json().catch(() => null)
    const accessToken = data?.access_token as string | undefined
    const newRefreshToken = data?.refresh_token as string | undefined
    if (accessToken) {
      setTokens(accessToken, newRefreshToken || refreshToken)
      return accessToken
    }
    clearTokens()
    return null
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function request<T>(
  path: string,
  method: HttpMethod,
  opts: ApiOptions,
  retry = true
): Promise<T> {
  const url = buildUrl(path, opts.query)
  const headers: Record<string, string> = {}
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData
  if (!isFormData) headers["Content-Type"] = "application/json"
  if (opts.headers) {
    if (opts.headers instanceof Headers) {
      opts.headers.forEach((value, key) => {
        headers[key] = value as string
      })
    } else if (Array.isArray(opts.headers)) {
      for (const [key, value] of opts.headers) headers[key] = value as string
    } else {
      Object.assign(headers, opts.headers as Record<string, string>)
    }
  }
  if (opts.auth) {
    const token = getAccessToken()
    if (token) headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts.body ? (isFormData ? opts.body : JSON.stringify(opts.body)) : undefined,
    credentials: "include",
  })

  if (res.status === 401 && opts.auth && retry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(path, method, opts, false)
    }
  }

  if (!res.ok) {
    let msg = `Request failed with ${res.status}`
    try {
      const data = await res.json()
      msg = data.detail || data.message || msg
    } catch (_) {}
    throw new Error(msg)
  }

  if (opts.responseType === "blob") {
    return (await res.blob()) as unknown as T
  }
  if (opts.responseType === "text") {
    return (await res.text()) as unknown as T
  }

  const text = await res.text()
  try {
    return text ? (JSON.parse(text) as T) : ({} as T)
  } catch {
    return text as unknown as T
  }
}

export async function api<T = any>(
  path: string,
  method: HttpMethod = "GET",
  opts: ApiOptions = {}
): Promise<T> {
  return request<T>(path, method, opts, true)
}

export async function login(username: string, password: string) {
  const form = new URLSearchParams()
  form.set("username", username)
  form.set("password", password)
  const res = await fetch(buildUrl("login"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error((data && (data.detail || data.message)) || `Login failed (${res.status})`)
  }
  const data = await res.json()
  if (data?.access_token) {
    setTokens(data.access_token, data.refresh_token)
  }
  return data
}

export function logout() {
  clearTokens()
}
