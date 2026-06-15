<script setup lang="ts">
import { ref } from 'vue'
import { useAmplifyStore } from '../stores/amplifyStore'

const store = useAmplifyStore()
const isSaving = ref(false)

const authModes = [
  { value: 'API_KEY', label: 'API Key (apiKey)' },
  { value: 'AMAZON_COGNITO_USER_POOLS', label: 'Cognito User Pools (userPool)' },
  { value: 'AWS_IAM', label: 'AWS IAM (iam)' },
  { value: 'OPENID_CONNECT', label: 'OpenID Connect (oidc)' },
]

async function handleConfigure() {
  isSaving.value = true
  try {
    await store.configureAmplify()
  } finally {
    isSaving.value = false
  }
}

function loadSample(type: 'todo-apikey' | 'todo-cognito') {
  if (type === 'todo-apikey') {
    store.config.endpoint = 'https://example-api.appsync-api.us-east-1.amazonaws.com/graphql'
    store.config.region = 'us-east-1'
    store.config.authMode = 'API_KEY'
    store.config.apiKey = 'da2-example-api-key1234567890'
    store.config.userPoolId = ''
    store.config.userPoolClientId = ''
  } else {
    store.config.endpoint = 'https://example-api.appsync-api.us-east-1.amazonaws.com/graphql'
    store.config.region = 'us-east-1'
    store.config.authMode = 'AMAZON_COGNITO_USER_POOLS'
    store.config.apiKey = ''
    store.config.userPoolId = 'us-east-1_example'
    store.config.userPoolClientId = 'example-client-id-12345678'
  }
  store.configError = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-zinc-100">Amplify Configuration</h3>
      <div class="flex items-center space-x-2 text-xs">
        <span class="text-zinc-500">Presets:</span>
        <button
          @click="loadSample('todo-apikey')"
          type="button"
          class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
        >
          API Key Mock
        </button>
        <button
          @click="loadSample('todo-cognito')"
          type="button"
          class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
        >
          Cognito Mock
        </button>
      </div>
    </div>

    <form @submit.prevent="handleConfigure" class="space-y-4">
      <!-- Endpoint -->
      <div>
        <label
          for="endpoint"
          class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
        >
          AppSync GraphQL Endpoint *
        </label>
        <input
          id="endpoint"
          v-model="store.config.endpoint"
          type="url"
          placeholder="https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql"
          required
          class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 rounded-md px-3 py-2 text-sm font-mono placeholder-zinc-600 transition duration-150"
        />
      </div>

      <!-- Region -->
      <div>
        <label
          for="region"
          class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
        >
          AWS Region *
        </label>
        <input
          id="region"
          v-model="store.config.region"
          type="text"
          placeholder="us-east-1"
          required
          class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 rounded-md px-3 py-2 text-sm font-mono placeholder-zinc-600 transition duration-150"
        />
      </div>

      <!-- Auth Mode -->
      <div>
        <label
          for="authMode"
          class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
        >
          Authentication Mode *
        </label>
        <select
          id="authMode"
          v-model="store.config.authMode"
          class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 rounded-md px-3 py-2 text-sm transition duration-150"
        >
          <option v-for="mode in authModes" :key="mode.value" :value="mode.value">
            {{ mode.label }}
          </option>
        </select>
      </div>

      <!-- Conditionally shown based on Auth Mode -->
      <div v-if="store.config.authMode === 'API_KEY'" class="pt-2">
        <label
          for="apiKey"
          class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
        >
          AppSync API Key *
        </label>
        <input
          id="apiKey"
          v-model="store.config.apiKey"
          type="password"
          placeholder="da2-xxxxxxxxxxxxxxxxxxxxxxxxxx"
          required
          class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 rounded-md px-3 py-2 text-sm font-mono placeholder-zinc-600 transition duration-150"
        />
      </div>

      <div v-if="store.config.authMode === 'AMAZON_COGNITO_USER_POOLS'" class="space-y-4 pt-2">
        <div>
          <label
            for="userPoolId"
            class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
          >
            Cognito User Pool ID *
          </label>
          <input
            id="userPoolId"
            v-model="store.config.userPoolId"
            type="text"
            placeholder="us-east-1_xxxxxxxxx"
            required
            class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 rounded-md px-3 py-2 text-sm font-mono placeholder-zinc-600 transition duration-150"
          />
        </div>

        <div>
          <label
            for="userPoolClientId"
            class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
          >
            Cognito User Pool Web Client ID *
          </label>
          <input
            id="userPoolClientId"
            v-model="store.config.userPoolClientId"
            type="text"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxx"
            required
            class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 rounded-md px-3 py-2 text-sm font-mono placeholder-zinc-600 transition duration-150"
          />
        </div>
      </div>

      <!-- Error message -->
      <div
        v-if="store.configError"
        class="p-3 bg-red-950/30 border border-red-800/40 rounded text-xs text-red-400"
      >
        {{ store.configError }}
      </div>

      <!-- Action Button -->
      <button
        type="submit"
        :disabled="isSaving"
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-750 disabled:bg-zinc-800 text-white font-medium text-sm rounded-md transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
      >
        <span v-if="isSaving">Saving Configuration...</span>
        <span v-else>{{
          store.isConfigured ? 'Update Configuration' : 'Save & Configure Amplify'
        }}</span>
      </button>
    </form>
  </div>
</template>
