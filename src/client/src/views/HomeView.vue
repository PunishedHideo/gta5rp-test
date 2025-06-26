<template>
  <div>
    <h1>Main page</h1>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
// there is a problem in this module where going to / says authorized even if it is not
router.push('/login')

// to be honest this page is not even needed. What is needed to just redirect from / to /login
</script>
