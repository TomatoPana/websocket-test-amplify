import { ref, computed, onMounted, onUnmounted } from 'vue'
import { defineStore } from 'pinia'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/api'
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

export interface AmplifyConfig {
  endpoint: string
  region: string
  authMode: 'API_KEY' | 'AMAZON_COGNITO_USER_POOLS' | 'AWS_IAM' | 'OPENID_CONNECT'
  apiKey: string
  userPoolId: string
  userPoolClientId: string
}

export interface SubscriptionMessage {
  id: string
  timestamp: string
  type: 'info' | 'message' | 'error' | 'success'
  title: string
  content: any
}

const STORAGE_KEY = 'amplify_sub_config'
const QUERY_STORAGE_KEY = 'amplify_sub_query'
const VARS_STORAGE_KEY = 'amplify_sub_vars'

const DEFAULT_CONFIG: AmplifyConfig = {
  endpoint: '',
  region: 'us-east-1',
  authMode: 'API_KEY',
  apiKey: '',
  userPoolId: '',
  userPoolClientId: ''
}

const DEFAULT_QUERY = `subscription OnCreateTodo {
  onCreateTodo {
    id
    name
    description
    createdAt
  }
}`

const DEFAULT_VARS = `{}`

export const useAmplifyStore = defineStore('amplify', () => {
  // Config state
  const config = ref<AmplifyConfig>({ ...DEFAULT_CONFIG })
  const isConfigured = ref(false)
  const configError = ref<string | null>(null)

  // Auth state
  const user = ref<{ username: string; userId: string } | null>(null)
  const authLoading = ref(false)
  const authError = ref<string | null>(null)

  // Network state
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  // Subscription state
  const subscriptionQuery = ref(DEFAULT_QUERY)
  const subscriptionVariables = ref(DEFAULT_VARS)
  const messages = ref<SubscriptionMessage[]>([])
  const isSubscribed = ref(false)
  const subscriptionStatus = ref<'idle' | 'connecting' | 'active' | 'error' | 'disconnected'>('idle')
  const subscriptionError = ref<string | null>(null)

  // Reference to active subscription instance
  let activeSubscription: any = null

  // Initialize from LocalStorage
  function loadFromStorage() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY)
      if (savedConfig) {
        config.value = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) }
      }
      
      const savedQuery = localStorage.getItem(QUERY_STORAGE_KEY)
      if (savedQuery) {
        subscriptionQuery.value = savedQuery
      }

      const savedVars = localStorage.getItem(VARS_STORAGE_KEY)
      if (savedVars) {
        subscriptionVariables.value = savedVars
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e)
    }
  }

  // Save config to LocalStorage
  function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    localStorage.setItem(QUERY_STORAGE_KEY, subscriptionQuery.value)
    localStorage.setItem(VARS_STORAGE_KEY, subscriptionVariables.value)
  }

  // Network status handlers
  function updateOnlineStatus() {
    isOnline.value = navigator.onLine
    addMessage({
      type: navigator.onLine ? 'success' : 'error',
      title: 'Network Connection Status Changed',
      content: { online: navigator.onLine, message: navigator.onLine ? 'Browser is online' : 'Browser is offline' }
    })
  }

  // Configure Amplify
  async function configureAmplify() {
    configError.value = null
    isConfigured.value = false
    user.value = null
    
    if (!config.value.endpoint) {
      configError.value = 'GraphQL Endpoint is required'
      return false
    }

    try {
      const amplifyConfig: any = {
        API: {
          GraphQL: {
            endpoint: config.value.endpoint,
            region: config.value.region,
            defaultAuthMode: 
              config.value.authMode === 'API_KEY' ? 'apiKey' :
              config.value.authMode === 'AMAZON_COGNITO_USER_POOLS' ? 'userPool' :
              config.value.authMode === 'AWS_IAM' ? 'iam' : 'oidc'
          }
        }
      }

      if (config.value.authMode === 'API_KEY') {
        if (!config.value.apiKey) {
          configError.value = 'API Key is required for API_KEY authentication mode'
          return false
        }
        amplifyConfig.API.GraphQL.apiKey = config.value.apiKey
      }

      if (config.value.authMode === 'AMAZON_COGNITO_USER_POOLS') {
        if (!config.value.userPoolId || !config.value.userPoolClientId) {
          configError.value = 'User Pool ID and Client ID are required for Cognito mode'
          return false
        }
        amplifyConfig.Auth = {
          Cognito: {
            userPoolId: config.value.userPoolId,
            userPoolClientId: config.value.userPoolClientId
          }
        }
      }

      // Configure
      Amplify.configure(amplifyConfig)
      isConfigured.value = true
      saveConfig()
      addMessage({
        type: 'success',
        title: 'Amplify Configured Successfully',
        content: {
          endpoint: config.value.endpoint,
          authMode: config.value.authMode,
          region: config.value.region
        }
      })

      // Check if user is already signed in
      if (config.value.authMode === 'AMAZON_COGNITO_USER_POOLS') {
        await checkCurrentUser()
      }

      return true
    } catch (err: any) {
      console.error(err)
      configError.value = err.message || 'Failed to configure AWS Amplify'
      addMessage({
        type: 'error',
        title: 'Configuration Error',
        content: configError.value
      })
      return false
    }
  }

  // Authentication methods
  async function checkCurrentUser() {
    try {
      const authUser = await getCurrentUser()
      user.value = {
        username: authUser.username,
        userId: authUser.userId
      }
      addMessage({
        type: 'info',
        title: 'Cognito Session Found',
        content: { username: authUser.username, userId: authUser.userId }
      })
    } catch (err) {
      user.value = null
    }
  }

  async function login(usernameValue: string, passwordValue: string) {
    if (!isConfigured.value) {
      authError.value = 'Amplify is not configured yet'
      return false
    }
    
    authLoading.value = true
    authError.value = null
    
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: usernameValue,
        password: passwordValue
      })

      if (isSignedIn) {
        await checkCurrentUser()
        addMessage({
          type: 'success',
          title: 'Signed In Successfully',
          content: { username: usernameValue }
        })
        return true
      } else {
        authError.value = `Sign in requires next step: ${nextStep.signInStep}`
        addMessage({
          type: 'error',
          title: 'Sign In Incomplete',
          content: authError.value
        })
        return false
      }
    } catch (err: any) {
      console.error(err)
      authError.value = err.message || 'Authentication failed'
      addMessage({
        type: 'error',
        title: 'Authentication Failed',
        content: authError.value
      })
      return false
    } finally {
      authLoading.value = false
    }
  }

  async function logout() {
    authLoading.value = true
    authError.value = null
    try {
      await signOut()
      const oldUsername = user.value?.username
      user.value = null
      addMessage({
        type: 'info',
        title: 'Signed Out Successfully',
        content: { username: oldUsername }
      })
    } catch (err: any) {
      console.error(err)
      authError.value = err.message || 'Sign out failed'
      addMessage({
        type: 'error',
        title: 'Sign Out Failed',
        content: authError.value
      })
    } finally {
      authLoading.value = false
    }
  }

  // Log message helper
  function addMessage(msg: Omit<SubscriptionMessage, 'id' | 'timestamp'>) {
    const message: SubscriptionMessage = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      ...msg
    }
    // Limit to 200 messages to prevent memory issues
    messages.value = [message, ...messages.value].slice(0, 200)
  }

  function clearMessages() {
    messages.value = []
  }

  // Subscription methods
  function startSubscription() {
    if (!isConfigured.value) {
      subscriptionError.value = 'Amplify must be configured before starting a subscription.'
      return
    }

    if (activeSubscription) {
      stopSubscription()
    }

    subscriptionError.value = null
    subscriptionStatus.value = 'connecting'
    isSubscribed.value = true

    addMessage({
      type: 'info',
      title: 'Connecting Subscription',
      content: { query: subscriptionQuery.value, variables: subscriptionVariables.value }
    })

    saveConfig()

    try {
      // Parse variables
      let parsedVariables = {}
      if (subscriptionVariables.value.trim()) {
        try {
          parsedVariables = JSON.parse(subscriptionVariables.value)
        } catch (e: any) {
          throw new Error(`Invalid variables JSON: ${e.message}`)
        }
      }

      // Generate API client
      const client = generateClient()

      // Start subscription
      const subObservable = client.graphql({
        query: subscriptionQuery.value,
        variables: parsedVariables
      }) as any

      // Observable returns a subscribe function
      activeSubscription = subObservable.subscribe({
        next: (response: any) => {
          subscriptionStatus.value = 'active'
          addMessage({
            type: 'message',
            title: 'Data Received',
            content: response.data || response
          })
        },
        error: (err: any) => {
          console.error('Subscription error:', err)
          subscriptionStatus.value = 'error'
          subscriptionError.value = JSON.stringify(err)
          addMessage({
            type: 'error',
            title: 'Subscription Error',
            content: err
          })
        },
        complete: () => {
          subscriptionStatus.value = 'disconnected'
          isSubscribed.value = false
          addMessage({
            type: 'info',
            title: 'Subscription Completed by Server',
            content: null
          })
        }
      })

      // If we got here, we're successfully listening (or at least sent the connection request)
      // Amplify subscriptions don't have a direct "onConnect" callback in Gen 2 API client,
      // but we status it active as it gets ready or on the first payload,
      // we'll set it to active right away to indicate the socket is initiated.
      subscriptionStatus.value = 'active'
      
      addMessage({
        type: 'success',
        title: 'Subscription Socket Listening',
        content: 'GraphQL Subscription listener established'
      })

    } catch (err: any) {
      console.error(err)
      subscriptionStatus.value = 'error'
      subscriptionError.value = err.message || 'Failed to start subscription'
      isSubscribed.value = false
      addMessage({
        type: 'error',
        title: 'Failed to Initiate Subscription',
        content: subscriptionError.value
      })
    }
  }

  function stopSubscription() {
    if (activeSubscription) {
      try {
        activeSubscription.unsubscribe()
        addMessage({
          type: 'info',
          title: 'Subscription Cancelled',
          content: 'Unsubscribed from socket stream'
        })
      } catch (err: any) {
        console.error('Unsubscribe error:', err)
      }
      activeSubscription = null
    }
    isSubscribed.value = false
    subscriptionStatus.value = 'disconnected'
  }

  // Lifecycle
  onMounted(() => {
    loadFromStorage()
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
      // initial check
      isOnline.value = navigator.onLine
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
    stopSubscription()
  })

  return {
    // Config
    config,
    isConfigured,
    configError,
    configureAmplify,
    
    // Auth
    user,
    authLoading,
    authError,
    login,
    logout,
    
    // Network
    isOnline,
    
    // Subscription
    subscriptionQuery,
    subscriptionVariables,
    messages,
    isSubscribed,
    subscriptionStatus,
    subscriptionError,
    startSubscription,
    stopSubscription,
    clearMessages,
    addMessage
  }
})
