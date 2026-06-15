<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAmplifyStore } from './stores/amplifyStore'
import ConfigForm from './components/ConfigForm.vue'
import AuthForm from './components/AuthForm.vue'
import MessageCard from './components/MessageCard.vue'
import MonacoEditor from './components/MonacoEditor.vue'

const store = useAmplifyStore()
const activeTab = ref<'config' | 'auth'>('config')
const filterType = ref<'all' | 'message' | 'error' | 'info'>('all')

// Filtered messages list
const filteredMessages = computed(() => {
  if (filterType.value === 'all') return store.messages
  return store.messages.filter((msg) => msg.type === filterType.value)
})

// Toggle active tab
function setTab(tab: 'config' | 'auth') {
  activeTab.value = tab
}

// Quick fill templates for GraphQL Query
function fillQueryTemplate(templateType: 'todos' | 'messages') {
  if (templateType === 'todos') {
    store.subscriptionQuery = /* GraphQL */ `
      subscription OnCreateTodo {
        onCreateTodo {
          id
          name
          description
          createdAt
        }
      }
    `
    store.subscriptionVariables = `{}`
  } else {
    store.subscriptionQuery = /* GraphQL */ `
      subscription OnCreateMessage($channelId: ID!) {
        onCreateMessage(channelId: $channelId) {
          id
          channelId
          sender
          content
          sentAt
        }
      }
    `
    store.subscriptionVariables = `{
  "channelId": "general"
}`
  }
  store.addMessage({
    type: 'info',
    title: 'Loaded Query Template',
    content: { template: templateType },
  })
}
</script>

<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
    <!-- Header -->
    <header
      class="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg select-none"
    >
      <div class="flex items-center space-x-3">
        <!-- GraphQL Socket Icon -->
        <div
          class="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 font-black"
        >
          GQL
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-white flex items-center">
            AWS Amplify GraphQL Subscription Tester
          </h1>
          <p class="text-xs text-zinc-400">Realtime AppSync WebSockets Interface</p>
        </div>
      </div>

      <!-- Live Status Metrics -->
      <div class="flex items-center space-x-3 text-xs">
        <!-- Browser Network Connectivity -->
        <span
          :class="[
            'px-2.5 py-1 rounded-full border flex items-center space-x-1.5 font-medium transition duration-200',
            store.isOnline
              ? 'bg-emerald-950/30 text-emerald-450 border-emerald-800/40'
              : 'bg-rose-950/30 text-rose-450 border-rose-800/40',
          ]"
        >
          <span
            :class="[
              'w-2 h-2 rounded-full',
              store.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500',
            ]"
          ></span>
          <span>{{ store.isOnline ? 'Browser Online' : 'Browser Offline' }}</span>
        </span>

        <!-- Socket Subscription Status -->
        <span
          :class="[
            'px-2.5 py-1 rounded-full border flex items-center space-x-1.5 font-medium transition duration-200',
            store.subscriptionStatus === 'active'
              ? 'bg-indigo-950/30 text-indigo-405 border-indigo-800/40'
              : store.subscriptionStatus === 'connecting'
                ? 'bg-amber-950/30 text-amber-405 border-amber-800/40 animate-pulse'
                : store.subscriptionStatus === 'error'
                  ? 'bg-rose-950/30 text-rose-455 border-rose-805/45'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800',
          ]"
        >
          <span
            :class="[
              'w-2 h-2 rounded-full',
              store.subscriptionStatus === 'active'
                ? 'bg-indigo-500 animate-ping'
                : store.subscriptionStatus === 'connecting'
                  ? 'bg-amber-500 animate-bounce'
                  : store.subscriptionStatus === 'error'
                    ? 'bg-rose-500'
                    : 'bg-zinc-650',
            ]"
          ></span>
          <span class="capitalize">Socket: {{ store.subscriptionStatus }}</span>
        </span>

        <!-- Active Configured Mode -->
        <span
          v-if="store.isConfigured"
          class="px-2.5 py-1 rounded-full bg-zinc-850 border border-zinc-700 text-zinc-300 font-mono"
        >
          {{ store.config.authMode }}
        </span>
      </div>
    </header>

    <!-- Main Workspace Layout -->
    <main class="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
      <!-- Left Panel: Configuration & Auth -->
      <section
        class="w-full md:w-[380px] lg:w-[420px] bg-zinc-900/40 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col md:overflow-y-auto shrink-0 select-none"
      >
        <!-- Tab Navigation -->
        <div class="flex border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <button
            @click="setTab('config')"
            type="button"
            :class="[
              'flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-150 outline-none',
              activeTab === 'config'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200 bg-transparent',
            ]"
          >
            ⚙️ Configuration
          </button>
          <button
            @click="setTab('auth')"
            type="button"
            :class="[
              'flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-150 outline-none',
              activeTab === 'auth'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200 bg-transparent',
              store.config.authMode === 'AMAZON_COGNITO_USER_POOLS' ? 'relative' : '',
            ]"
          >
            👤 Cognito Auth
            <span
              v-if="store.config.authMode === 'AMAZON_COGNITO_USER_POOLS' && !store.user"
              class="absolute top-2.5 right-4 w-2 h-2 rounded-full bg-amber-500"
            ></span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-6 flex-1 overflow-y-auto">
          <div v-show="activeTab === 'config'">
            <ConfigForm />
          </div>
          <div v-show="activeTab === 'auth'">
            <AuthForm />
          </div>

          <!-- Helper Instructions footer -->
          <div class="mt-8 pt-6 border-t border-zinc-800/80 space-y-4">
            <h4 class="text-xs font-semibold text-zinc-450 uppercase tracking-wider">
              Subscription Testing Steps
            </h4>
            <ol class="text-xs text-zinc-400 list-decimal pl-4 space-y-2 leading-relaxed">
              <li>
                Enter your AppSync parameters in the
                <span class="text-zinc-200">Configuration</span> tab.
              </li>
              <li>Click <span class="text-indigo-400">Save & Configure</span>.</li>
              <li>
                If using <span class="text-zinc-250 font-semibold">Cognito User Pools</span>,
                authenticate in the Cognito tab.
              </li>
              <li>Compose your Subscription Query and variables.</li>
              <li>
                Click <span class="text-emerald-450 font-semibold">Subscribe</span> to test the live
                connection.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <!-- Right Panel: Query Editor & Live Logs Stream -->
      <section class="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden">
        <!-- GraphQL Editors (Query + Variables) -->
        <div class="bg-zinc-900/10 border-b border-zinc-800 p-6 space-y-4 shrink-0">
          <div class="flex items-center justify-between">
            <h2
              class="text-sm font-semibold text-zinc-250 uppercase tracking-wider flex items-center space-x-2 select-none"
            >
              <span>GraphQL Subscription Editor</span>
            </h2>
            <div class="flex items-center space-x-2 text-xs select-none">
              <span class="text-zinc-550">Templates:</span>
              <button
                @click="fillQueryTemplate('todos')"
                type="button"
                class="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded transition"
              >
                Todo Created
              </button>
              <button
                @click="fillQueryTemplate('messages')"
                type="button"
                class="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded transition"
              >
                Message Received
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Query Field -->
            <div class="lg:col-span-2 space-y-1.5">
              <div class="block text-xs text-zinc-450 select-none">Subscription Query</div>
              <MonacoEditor
                v-model="store.subscriptionQuery"
                language="graphql"
                height="15rem"
                :read-only="store.isSubscribed"
              />
            </div>

            <!-- Variables Field -->
            <div class="space-y-1.5">
              <div class="block text-xs text-zinc-450 select-none">Variables (JSON)</div>
              <MonacoEditor
                v-model="store.subscriptionVariables"
                language="json"
                height="15rem"
                :read-only="store.isSubscribed"
              />
            </div>
          </div>

          <!-- Run Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-4 select-none">
            <div class="text-xs text-zinc-500">
              <span v-if="store.subscriptionError" class="text-rose-400 font-semibold">
                {{ store.subscriptionError.slice(0, 100) }}...
              </span>
              <span
                v-else-if="store.isSubscribed"
                class="text-indigo-400 animate-pulse font-medium"
              >
                Listening on websocket socket. Send mutations from your AppSync console to test.
              </span>
              <span v-else> Click Subscribe to begin listening to the WebSocket stream. </span>
            </div>

            <div class="flex items-center space-x-3">
              <button
                v-if="store.isSubscribed"
                @click="store.stopSubscription"
                type="button"
                class="py-2 px-5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-sm rounded shadow transition duration-150"
              >
                🔴 Unsubscribe
              </button>

              <button
                v-else
                @click="store.startSubscription"
                type="button"
                :disabled="!store.isConfigured || !store.isOnline"
                class="py-2 px-5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-zinc-850 disabled:text-zinc-650 active:bg-indigo-800 text-white font-semibold text-sm rounded shadow transition duration-150"
              >
                🔌 Subscribe
              </button>
            </div>
          </div>
        </div>

        <!-- Live Messages Stream Console -->
        <div class="flex-1 flex flex-col min-h-0 bg-zinc-950/20">
          <!-- Console Toolbar -->
          <div
            class="px-6 py-3 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between gap-4 shrink-0 select-none"
          >
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-zinc-300 uppercase tracking-wider"
                >Live Socket Feed</span
              >
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-550 border border-zinc-700/80 font-mono"
              >
                {{ store.messages.length }} entries
              </span>
            </div>

            <!-- Log filters & actions -->
            <div class="flex items-center space-x-3 text-xs">
              <!-- Filter pills -->
              <div class="flex bg-zinc-950 border border-zinc-800 rounded p-0.5">
                <button
                  v-for="f in ['all', 'message', 'error', 'info'] as const"
                  :key="f"
                  @click="filterType = f"
                  type="button"
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors duration-150',
                    filterType === f
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-350 bg-transparent',
                  ]"
                >
                  {{ f }}
                </button>
              </div>

              <!-- Clear button -->
              <button
                @click="store.clearMessages"
                type="button"
                class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition text-xs font-medium"
              >
                Clear Feed
              </button>
            </div>
          </div>

          <!-- Logs Feed Container -->
          <div class="flex-1 p-6 overflow-y-auto space-y-4">
            <div
              v-if="filteredMessages.length === 0"
              class="h-full flex flex-col items-center justify-center text-center p-8 select-none"
            >
              <div
                class="w-12 h-12 rounded-full border border-dashed border-zinc-800 flex items-center justify-center text-zinc-650 text-xl mb-3"
              >
                💤
              </div>
              <h3 class="text-sm font-semibold text-zinc-400">Stream Console Silent</h3>
              <p class="text-xs text-zinc-600 mt-1 max-w-sm">
                No events in feed. Configure connection settings, hit Subscribe, and run mutations
                to trigger events.
              </p>
            </div>

            <!-- Transition group for list items -->
            <div v-else class="space-y-4">
              <MessageCard v-for="msg in filteredMessages" :key="msg.id" :message="msg" />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(18, 18, 18, 0.2);
}
::-webkit-scrollbar-thumb {
  background: rgba(63, 63, 70, 0.4);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(82, 82, 91, 0.6);
}
</style>
