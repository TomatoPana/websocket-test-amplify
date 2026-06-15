<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

type EditorTheme = 'vs' | 'vs-dark'

interface MonacoEditorProps {
    modelValue: string
    language?: string
    theme?: EditorTheme
    height?: string | number
    readOnly?: boolean
}

const props = withDefaults(defineProps<MonacoEditorProps>(), {
    language: 'plaintext',
    theme: 'vs-dark',
    height: '15rem',
    readOnly: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const container = ref<HTMLElement | null>(null)
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null
let modelChangeDisposable: monaco.IDisposable | null = null

const editorHeight = computed(() =>
    typeof props.height === 'number' ? `${props.height}px` : props.height,
)

if (typeof window !== 'undefined') {
    const existingEnvironment = (
        window as typeof window & {
            MonacoEnvironment?: { getWorker?: () => Worker }
        }
    ).MonacoEnvironment

    if (!existingEnvironment?.getWorker) {
        ;(
            window as typeof window & {
                MonacoEnvironment?: { getWorker: () => Worker }
            }
        ).MonacoEnvironment = {
            getWorker: () => new EditorWorker(),
        }
    }
}

onMounted(() => {
    if (!container.value) {
        return
    }

    editorInstance = monaco.editor.create(container.value, {
        value: props.modelValue,
        language: props.language,
        theme: props.theme,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        fontSize: 13,
        lineNumbers: 'on',
        readOnly: props.readOnly,
        renderValidationDecorations: 'on',
    })

    modelChangeDisposable = editorInstance.onDidChangeModelContent(() => {
        const nextValue = editorInstance?.getValue() ?? ''
        if (nextValue !== props.modelValue) {
            emit('update:modelValue', nextValue)
        }
    })
})

watch(
    () => props.modelValue,
    (nextValue) => {
        if (!editorInstance) {
            return
        }

        if (nextValue !== editorInstance.getValue()) {
            editorInstance.setValue(nextValue)
        }
    },
)

watch(
    () => props.language,
    (nextLanguage) => {
        const model = editorInstance?.getModel()
        if (model) {
            monaco.editor.setModelLanguage(model, nextLanguage)
        }
    },
)

watch(
    () => props.theme,
    (nextTheme) => {
        if (editorInstance) {
            monaco.editor.setTheme(nextTheme)
        }
    },
)

watch(
    () => props.readOnly,
    (nextReadOnly) => {
        editorInstance?.updateOptions({ readOnly: nextReadOnly })
    },
)

onBeforeUnmount(() => {
    modelChangeDisposable?.dispose()
    editorInstance?.dispose()
    modelChangeDisposable = null
    editorInstance = null
})
</script>

<template>
    <div
        ref="container"
        class="overflow-hidden rounded-md border border-zinc-800"
        :style="{ height: editorHeight }"
    ></div>
</template>
