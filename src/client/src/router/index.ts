import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import HomeView from '../views/HomeView.vue'
import GameBoardView from '../views/GameBoardView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: AuthView
  },
  {
    path: '/gameboard',
    name: 'Gameboard',
    component: GameBoardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

async function checkAuth(): Promise<{ authorized: boolean, nickname?: string }> {
  try {
    const res = await fetch('http://127.0.0.1:4000/api/auth', {
      credentials: 'include'
    })

    if (res.ok) {
      return { authorized: true, nickname: await res.json() as string } // NOTE this is probably not a good approach to authorization.
      // there should be authorized: true returned from the backend, not like that
      // will be enough for testing but need to change it later
    } else if (!res.ok) {
      return { authorized: false }
    }

    return await res.json()
  } catch {
    return { authorized: false }
  }
}

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const isAuthorized = await checkAuth()
    if (!isAuthorized.authorized) {
      next({ name: 'Login' })
    } else {
      next()
    }
  } else if (to.name === 'Login') {
    const isAuthorized = await checkAuth()
    // console.log(isAuthorized)
    if (isAuthorized.authorized) {
      next({ name: 'Gameboard' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
