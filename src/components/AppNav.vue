<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue"
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const auth = useAuthStore()
const router = useRouter()

const navItems = computed(() => [
  { name: "Dashboard", to: "/" },
  { name: "Multiplication Printouts", to: "/tools/multiplication-printouts" },
  { name: "GCD / HCF Explorer", to: "/tools/gcd-hcf" },
  { name: "LCM Explorer", to: "/tools/lcm" },
])

const userLabel = computed(() => auth.user?.full_name || auth.user?.username || "User")
const userInitials = computed(() => {
  const label = userLabel.value.trim()
  if (!label) return "U"
  const parts = label.split(/\s+/).filter(Boolean)
  const initials = parts.length === 1 ? parts[0][0] : `${parts[0][0]}${parts[parts.length - 1][0]}`
  return initials.toUpperCase()
})

function signOut() {
  auth.logout()
  void router.push({ name: "login" })
}
</script>

<template>
  <Disclosure as="header" class="app-header" v-slot="{ open }">
    <div class="nav-shell">
      <div class="nav-left">
        <RouterLink to="/" class="brand">Shuleyangu Math</RouterLink>
        <nav class="nav-links">
          <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
            {{ item.name }}
          </RouterLink>
        </nav>
      </div>

      <div class="nav-right">
        <Menu v-if="auth.authenticated" as="div" class="profile-menu">
          <MenuButton class="profile-button">
            <span class="avatar">{{ userInitials }}</span>
            <span class="profile-label">Account</span>
          </MenuButton>
          <MenuItems class="profile-dropdown">
            <div class="profile-meta">
              <span class="profile-meta-label">School</span>
              <span class="profile-meta-value">{{ auth.schoolName || "—" }}</span>
            </div>
            <div class="profile-meta">
              <span class="profile-meta-label">User</span>
              <span class="profile-meta-value">{{ userLabel }}</span>
            </div>
            <div class="profile-meta">
              <span class="profile-meta-label">Role</span>
              <span class="profile-meta-value">{{ auth.user?.role || "—" }}</span>
            </div>
            <MenuItem>
              <button class="profile-item" type="button" @click="signOut">Sign out</button>
            </MenuItem>
          </MenuItems>
        </Menu>
        <RouterLink v-else class="ghost" to="/login">Sign in</RouterLink>

        <DisclosureButton class="nav-toggle" aria-label="Toggle navigation">
          <span :class="open ? 'toggle-bar open' : 'toggle-bar'"></span>
          <span :class="open ? 'toggle-bar open' : 'toggle-bar'"></span>
          <span :class="open ? 'toggle-bar open' : 'toggle-bar'"></span>
        </DisclosureButton>
      </div>
    </div>

    <DisclosurePanel class="nav-panel">
      <div class="nav-panel-links">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
          {{ item.name }}
        </RouterLink>
        <div v-if="auth.authenticated" class="nav-panel-meta">
          <span>{{ auth.schoolName || "—" }}</span>
          <span>{{ userLabel }}</span>
        </div>
        <button v-if="auth.authenticated" class="ghost" type="button" @click="signOut">Sign out</button>
        <RouterLink v-else class="ghost" to="/login">Sign in</RouterLink>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
