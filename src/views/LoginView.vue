<script setup lang="ts">
import { reactive, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  username: "",
  password: "",
})

const error = ref<string | null>(null)

async function submit() {
  error.value = null
  try {
    await auth.login(form.username.trim(), form.password)
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/"
    await router.replace(redirect)
  } catch (err: any) {
    error.value = err?.message || "Unable to sign in"
  }
}
</script>

<template>
  <section class="login-shell">
    <div class="login-card">
      <div class="login-header">
        <p class="eyebrow">Shuleyangu Math</p>
        <h1>Sign in</h1>
        <p class="subtle">Use your school account to access math tools.</p>
      </div>

      <form class="login-form" @submit.prevent="submit">
        <label>
          <span>Username or Email</span>
          <input v-model="form.username" type="text" autocomplete="username" required />
        </label>
        <label>
          <span>Password</span>
          <input v-model="form.password" type="password" autocomplete="current-password" required />
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="auth.loading">
          {{ auth.loading ? "Signing in..." : "Sign in" }}
        </button>
      </form>
    </div>
  </section>
</template>
