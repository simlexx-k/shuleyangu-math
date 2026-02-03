import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        requiresAuth: true,
        title: 'Dashboard',
        description: 'Overview of Shuleyangu Math tools and school context.',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'Sign in',
        description: 'Sign in to Shuleyangu Math to access school math tools and printouts.',
      },
    },
    {
      path: '/tools/multiplication-printouts',
      name: 'multiplication-printouts',
      component: () => import('../views/MultiplicationPrintoutsView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Multiplication Printouts',
        description: 'Generate printable multiplication grids and times-table worksheets.',
      },
    },
    {
      path: '/tools/gcd-hcf',
      name: 'gcd-hcf',
      component: () => import('../views/GcdHcfView.vue'),
      meta: {
        requiresAuth: true,
        title: 'GCD / HCF Explorer',
        description: 'Compute greatest common divisors and generate HCF practice worksheets.',
      },
    },
    {
      path: '/tools/lcm',
      name: 'lcm',
      component: () => import('../views/LcmView.vue'),
      meta: {
        requiresAuth: true,
        title: 'LCM Explorer',
        description: 'Compute least common multiples and generate LCM practice worksheets.',
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  auth.syncFromStorage()
  await auth.bootstrap()
  if (to.meta.requiresAuth && !auth.authenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.authenticated) {
    return { name: 'dashboard' }
  }
  return true
})

const defaultTitle = 'Shuleyangu Math'
const defaultDescription =
  'Shuleyangu Math provides printable multiplication tables and math practice tools for schools.'

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let tag = document.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) || defaultTitle
  const description = (to.meta.description as string | undefined) || defaultDescription
  document.title = title === defaultTitle ? defaultTitle : `${title} | ${defaultTitle}`
  setMetaTag('name', 'description', description)
  setMetaTag('property', 'og:title', document.title)
  setMetaTag('property', 'og:description', description)
  setMetaTag('property', 'og:url', window.location.href)
  setMetaTag('name', 'twitter:title', document.title)
  setMetaTag('name', 'twitter:description', description)
})

export default router
