<script setup lang="ts">
import { ref } from 'vue'
import { useAmplifyStore } from '../stores/amplifyStore'

const store = useAmplifyStore()
const username = ref('')
const password = ref('')

async function handleLogin() {
  if (!username.value || !password.value) return
  
  const success = await store.login(username.value, password.value)
  if (success) {
    password.value = ''
  }
}

async function handleLogout() {
  await store.logout()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-zinc-100">Cognito Authentication</h3>
      <span 
        v-if="store.isConfigured && store.config.authMode === 'AMAZON_COGNITO_USER_POOLS'"
        :class="[
          'px-2 py-0.5 rounded text-xs border font-medium uppercase',
          store.user 
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' 
            : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
        ]"
      >
        {{ store.user ? 'Authenticated' : 'Logged Out' }}
      </span>
    </div>

    <!-- Case 1: Amplify is not configured -->
    <div 
      v-if="!store.isConfigured" 
      class="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center"
    >
      <p class="text-sm text-zinc-400">
        Please configure AWS Amplify on the Configuration tab first.
      </p>
    </div>

    <!-- Case 2: Configured in non-Cognito mode -->
    <div 
      v-else-if="store.config.authMode !== 'AMAZON_COGNITO_USER_POOLS'"
      class="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center space-y-2"
    >
      <p class="text-sm text-zinc-300">
        Cognito Auth is not active.
      </p>
      <p class="text-xs text-zinc-500">
        Amplify is configured to use <span class="font-mono text-zinc-400">{{ store.config.authMode }}</span>. No sign-in is required; GraphQL calls will authenticate automatically.
      </p>
    </div>

    <!-- Case 3: Cognito Mode & Logged In -->
    <div 
      v-else-if="store.user"
      class="space-y-4"
    >
      <div class="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 text-lg font-bold uppercase">
            {{ store.user.username[0] }}
          </div>
          <div>
            <h4 class="text-sm font-semibold text-zinc-200">{{ store.user.username }}</h4>
            <p class="text-xs text-zinc-500 font-mono">ID: {{ store.user.userId }}</p>
          </div>
        </div>
      </div>

      <button 
        @click="handleLogout"
        :disabled="store.authLoading"
        class="w-full py-2.5 px-4 bg-zinc-850 hover:bg-zinc-800 disabled:bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 font-medium text-sm rounded-md transition duration-150"
      >
        <span v-if="store.authLoading">Signing Out...</span>
        <span v-else>Sign Out</span>
      </button>
    </div>

    <!-- Case 4: Cognito Mode & Logged Out -->
    <form v-else @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="username" class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
          Username or Email *
        </label>
        <input 
          id="username"
          v-model="username"
          type="text" 
          placeholder="developer@example.com"
          required
          class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 rounded-md px-3 py-2 text-sm placeholder-zinc-650 transition duration-150"
        />
      </div>

      <div>
        <label for="password" class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
          Password *
        </label>
        <input 
          id="password"
          v-model="password"
          type="password" 
          placeholder="••••••••"
          required
          class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 rounded-md px-3 py-2 text-sm placeholder-zinc-650 transition duration-150"
        />
      </div>

      <!-- Auth Errors -->
      <div v-if="store.authError" class="p-3 bg-red-950/30 border border-red-800/40 rounded text-xs text-red-400">
        {{ store.authError }}
      </div>

      <button 
        type="submit"
        :disabled="store.authLoading"
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-750 disabled:bg-zinc-800 text-white font-medium text-sm rounded-md transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <span v-if="store.authLoading">Signing In...</span>
        <span v-else>Sign In</span>
      </button>
    </form>
  </div>
</template>
