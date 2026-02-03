import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { api, getAccessToken, getRefreshToken, login as apiLogin, clearTokens, refreshAccessToken } from "@/lib/api"

export type SchoolSummary = {
  id: number
  name?: string | null
}

export type User = {
  id: number
  username: string
  email: string
  role: string
  full_name?: string | null
  school_id?: number | null
  school?: SchoolSummary | null
}

let bootstrapPromise: Promise<void> | null = null

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(getAccessToken())
  const refreshToken = ref<string | null>(getRefreshToken())
  const user = ref<User | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const authenticated = computed(() => !!accessToken.value)
  const schoolName = computed(() => {
    if (user.value?.school?.name) return user.value.school.name
    if (user.value?.school_id) return `School #${user.value.school_id}`
    return null
  })

  function syncFromStorage() {
    accessToken.value = getAccessToken()
    refreshToken.value = getRefreshToken()
  }

  async function bootstrap() {
    if (initialized.value) return
    if (bootstrapPromise) return bootstrapPromise
    bootstrapPromise = (async () => {
      syncFromStorage()
      if (accessToken.value) {
        try {
          await fetchMe()
        } catch (err) {
          logout()
        }
      }
      initialized.value = true
    })().finally(() => {
      bootstrapPromise = null
    })
    return bootstrapPromise
  }

  async function login(username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const data = await apiLogin(username, password)
      accessToken.value = data?.access_token ?? getAccessToken()
      refreshToken.value = data?.refresh_token ?? getRefreshToken()
      user.value = data?.user ?? null
      if (!user.value && accessToken.value) {
        await fetchMe()
      }
      return data
    } catch (err: any) {
      error.value = err?.message || "Login failed"
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    const nextToken = await refreshAccessToken()
    if (!nextToken) {
      logout()
      return null
    }
    accessToken.value = nextToken
    return nextToken
  }

  async function fetchMe() {
    const data = await api<User>("users/me", "GET", { auth: true })
    user.value = data
    return data
  }

  function logout() {
    clearTokens()
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  return {
    accessToken,
    refreshToken,
    user,
    error,
    loading,
    initialized,
    authenticated,
    schoolName,
    syncFromStorage,
    bootstrap,
    login,
    refresh,
    fetchMe,
    logout,
  }
})
