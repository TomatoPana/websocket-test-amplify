<script setup lang="ts">
import { ref } from 'vue'
import type { SubscriptionMessage } from '../stores/amplifyStore'

const props = defineProps<{
    message: SubscriptionMessage
}>()

const isExpanded = ref(true)
const isCopied = ref(false)

function toggleExpand() {
    isExpanded.value = !isExpanded.value
}

async function copyToClipboard() {
    try {
        const textToCopy =
            typeof props.message.content === 'object'
                ? JSON.stringify(props.message.content, null, 2)
                : String(props.message.content)

        await navigator.clipboard.writeText(textToCopy)
        isCopied.value = true
        setTimeout(() => {
            isCopied.value = false
        }, 2000)
    } catch (err) {
        console.error('Failed to copy text: ', err)
    }
}

// Compute theme classes based on message type
const typeClasses = {
    info: {
        bg: 'bg-zinc-900 border-zinc-700',
        headerBg: 'bg-zinc-800/50 border-zinc-700',
        title: 'text-zinc-300',
        icon: 'ℹ️',
        badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    },
    success: {
        bg: 'bg-emerald-950/20 border-emerald-800/40',
        headerBg: 'bg-emerald-950/40 border-emerald-800/30',
        title: 'text-emerald-300',
        icon: '✅',
        badge: 'bg-emerald-950 text-emerald-400 border border-emerald-800/50',
    },
    error: {
        bg: 'bg-rose-950/20 border-rose-800/40',
        headerBg: 'bg-rose-950/40 border-rose-800/30',
        title: 'text-rose-300',
        icon: '❌',
        badge: 'bg-rose-950 text-rose-400 border border-rose-800/50',
    },
    message: {
        bg: 'bg-indigo-950/10 border-indigo-500/20',
        headerBg: 'bg-indigo-950/20 border-indigo-500/10',
        title: 'text-indigo-200',
        icon: '📥',
        badge: 'bg-indigo-950 text-indigo-400 border border-indigo-500/30',
    },
}[props.message.type] || {
    bg: 'bg-zinc-900 border-zinc-700',
    headerBg: 'bg-zinc-800 border-zinc-700',
    title: 'text-zinc-300',
    icon: '•',
    badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
}
</script>

<template>
    <div
        :class="[
            'rounded-lg border shadow-md overflow-hidden transition-all duration-200',
            typeClasses.bg,
        ]"
    >
        <!-- Card Header -->
        <div
            :class="['px-4 py-3 flex items-center justify-between border-b', typeClasses.headerBg]"
        >
            <div class="flex items-center space-x-3 min-w-0">
                <span class="text-sm select-none">{{ typeClasses.icon }}</span>
                <div class="min-w-0">
                    <h4 :class="['text-sm font-semibold truncate', typeClasses.title]">
                        {{ message.title }}
                    </h4>
                    <p class="text-xs text-zinc-500 select-none">
                        {{ message.timestamp }}
                    </p>
                </div>
            </div>

            <div class="flex items-center space-x-2 shrink-0">
                <span
                    :class="[
                        'text-[10px] font-mono uppercase px-2 py-0.5 rounded-full select-none',
                        typeClasses.badge,
                    ]"
                >
                    {{ message.type }}
                </span>

                <!-- Copy Button -->
                <button
                    v-if="message.content"
                    @click="copyToClipboard"
                    type="button"
                    class="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Copy payload to clipboard"
                >
                    <span class="text-xs font-mono select-none">{{
                        isCopied ? 'Copied!' : 'Copy'
                    }}</span>
                </button>

                <!-- Toggle Collapse Button -->
                <button
                    v-if="message.content"
                    @click="toggleExpand"
                    type="button"
                    class="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                    <span class="text-xs font-mono select-none">{{
                        isExpanded ? 'Collapse' : 'Expand'
                    }}</span>
                </button>
            </div>
        </div>

        <!-- Content / JSON Payload -->
        <div
            v-if="isExpanded && message.content"
            class="p-4 overflow-x-auto text-xs font-mono text-zinc-300 max-h-[300px] overflow-y-auto"
        >
            <pre v-if="typeof message.content === 'object'">{{
                JSON.stringify(message.content, null, 2)
            }}</pre>
            <pre v-else class="whitespace-pre-wrap">{{ message.content }}</pre>
        </div>
    </div>
</template>
