# websocket-test

Single-page tester for AWS AppSync GraphQL subscriptions using AWS Amplify (v6) in a Vue 3 app. It is built to validate realtime websocket behavior, auth modes, query/variables payloads, and message stream handling from one UI.

## Purpose

This project helps you:

- Configure Amplify at runtime (no hardcoded endpoint required).
- Test AppSync subscription connections over websocket.
- Switch auth mode quickly (API Key, Cognito User Pools, IAM, OIDC).
- Sign in/out when using Cognito User Pools.
- Edit subscription queries and variables with Monaco Editor.
- Observe live payloads, errors, status changes, and connectivity logs.

## Tech Stack

- Vue 3 + TypeScript
- Vite 8
- Pinia
- Vue Router
- AWS Amplify v6 (Auth + GraphQL API client)
- Monaco Editor
- Tailwind CSS v4
- ESLint + Oxlint + Prettier

## Prerequisites

- Node.js version: ^20.19.0 or >=22.12.0
- npm
- AWS account (for AppSync and optional Cognito)

## Required External Services

This app requires an existing AWS AppSync GraphQL API endpoint.

### Required

1. AWS AppSync GraphQL API
2. Subscription field(s) in your schema/resolvers (for example, onCreateTodo)
3. One enabled auth mode matching what you choose in the UI

### Optional (only if you choose Cognito User Pools mode)

1. Amazon Cognito User Pool
2. Cognito App Client for that User Pool
3. A test user in the User Pool

## How To Create External Services

### Option A: Fast start with API Key auth (recommended for first run)

1. Open AWS Console and create an AppSync GraphQL API.
2. Choose API Key as one auth mode.
3. Add a schema that includes at least one subscription.
4. Add resolvers/data source so mutations trigger subscription events.
5. Copy from AppSync:
   - GraphQL endpoint URL
   - Region
   - API key

Example schema pattern:

    type Todo {
      id: ID!
      name: String!
      description: String
      createdAt: AWSDateTime
    }

    type Mutation {
      createTodo(name: String!, description: String): Todo
    }

    type Subscription {
      onCreateTodo: Todo
        @aws_subscribe(mutations: ["createTodo"])
    }

    type Query {
      _ping: String
    }

    schema {
      query: Query
      mutation: Mutation
      subscription: Subscription
    }

### Option B: Cognito User Pools auth

1. Create or reuse an AppSync API with Cognito User Pools enabled.
2. Create a Cognito User Pool in the same region (or update existing).
3. Create an App Client for the User Pool.
4. Create at least one user (confirm password/verification as required).
5. Copy:
   - AppSync endpoint URL
   - Region
   - Cognito User Pool ID
   - Cognito App Client ID
   - Test username and password

Notes:

- The app can render IAM and OIDC auth modes, but this repository only includes built-in sign-in flow for Cognito User Pools.
- For IAM/OIDC, you must provide credentials/tokens through a suitable Amplify/browser auth setup.

## Installation

From project root:

    npm install

## How To Run

### Start dev server

    npm run dev

Open the local URL printed by Vite (usually <http://localhost:5173>).

### Configure the app

1. Open the Configuration tab.
2. Enter:
   - AppSync endpoint
   - AWS region
   - Auth mode
   - Matching auth credentials (API key or Cognito IDs)
3. Click Save and Configure Amplify.

### Authenticate (if using Cognito)

1. Open Cognito Auth tab.
2. Sign in with your test user.

### Start a subscription test

1. In GraphQL Subscription Editor, use a template or paste your subscription query.
2. Set variables JSON if required.
3. Click Subscribe.
4. Trigger matching mutations from your backend, AppSync console, or another client.
5. Verify incoming events in Live Socket Feed.

### Stop test

- Click Unsubscribe.
- Clear Feed to reset logs.

## Available Scripts

- Development server:

      npm run dev

- Type-check + production build:

      npm run build

- Preview production build locally:

      npm run preview

- Lint (Oxlint + ESLint):

      npm run lint

- Format src with Prettier:

      npm run format

## Troubleshooting

- Configuration Error: confirm endpoint, region, and required auth fields match selected auth mode.
- Invalid variables JSON: ensure Variables editor contains valid JSON.
- Subscription starts but no messages: verify your mutation is wired to the subscription in schema/resolvers.
- Cognito sign-in fails: confirm user exists, is confirmed, and app client/user pool IDs are correct.
- Browser offline status: app blocks online subscription testing when browser reports offline.
