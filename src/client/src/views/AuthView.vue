<template>
  <div class="auth-page">
    <div class="auth-container">
      <h2>Authentication</h2>
      <form @submit.prevent="onLogin">
        <input
          v-model="username"
          placeholder="Username"
          autocomplete="username"
          required
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          required
        />
        <button type="submit">Login</button>
        <button type="button" @click="onSignUp" class="signup-btn">Sign Up</button>
        <p v-if="message" class="error">{{ message }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const message = ref('')
const router = useRouter()

async function onLogin() {
  if (username.value.length < 5 && password.value.length < 5) {
    message.value = 'Password and login must be at least 5 characters long'
    return
  }

  message.value = ''

  try {
    const response = await fetch('http://127.0.0.1:4000/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: username.value,
        password: password.value
      })
    })
    if (response.ok) {
      // Fetch nickname from /api/auth after login
      const authRes = await fetch('http://127.0.0.1:4000/api/auth', {
        credentials: 'include'
      })
      if (authRes.ok) {
        const nickname = await authRes.json()
        localStorage.setItem('nickname', nickname)
      }
      router.push('/gameboard')
    } else {
      message.value = "Login or password don't match"
    }
  } catch (e) {
    message.value = 'Something is wrong. Try again'
  }
}

async function onSignUp() {
  if (username.value.length < 5 && password.value.length < 5) {
    message.value = 'Password and login must be at least 5 characters long'
    return
  }

  message.value = ''
  // POST fetch for registration credentials
  try {
    const response = await fetch('http://127.0.0.1:4000/api/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: username.value,
        password: password.value
      })
    }) // <-- POST fetch for registration
    if (response.ok) {
      message.value = 'Registration completed successfully. Log in now'
      // the token will be in the http-only cookies
      // router.push('/') // Probably it should redirect to '/gameboard'
    } else {
      message.value = 'User already registered. Log in instead'
    }
  } catch (e) {
    message.value = 'Something is wrong. Try again'
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #181818;
}
.auth-container {
  width: 350px;
  padding: 2rem;
  border: 2px solid #FDD017;
  border-radius: 8px;
  background: #181818;
  box-shadow: 0 2px 8px #0001;
  display: flex;
  flex-direction: column;
  align-items: center;
}
form {
  width: 100%;
  display: flex;
  flex-direction: column;
}
input {
  /*margin-top: 1rem;*/
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  font-size: 1rem;
}
button {
  padding: 0.4rem;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}
.signup-btn {
  background: #eee;
  color: #333;
}
.error {
  color: red;
  margin-top: 0.5rem;
  text-align: center;
}
</style>