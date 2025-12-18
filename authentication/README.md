# Authentication & Authorization Flow

This document outlines the authentication and authorization mechanisms used in the `referral-pulse-next-ory` application, leveraging the Ory stack (Kratos for identity, Keto for permissions).

## Overview

The application uses a centralized authentication system where:

- **Identity Management (AuthN)** is handled by **Ory Kratos**.
- **Permission Management (AuthZ)** is handled by **Ory Keto**.
- **Session Management** is handled via cookies and validated against the Ory Frontend API.

## Authentication Flow (Login/Registration)

1.  **Request Interception**:

    - When a user accesses a protected route (e.g., `/dashboard`), the Next.js Middleware (`middleware.ts`) or Server Actions (`requireSession`) intercept the request.
    - It checks for the presence of a valid session using `getSession()`.

2.  **Session Validation**:

    - `getSession()` extracts the `ory_kratos_session` cookie from the request.
    - It calls the Ory Frontend API (`toSession`) to validate the cookie.
    - **If valid**: The session data (identity, traits) is returned.
    - **If invalid/missing**: The user is considered unauthenticated.

3.  **Redirect to Login**:

    - If no session exists, the user is redirected to the Authentication Node (Ory Kratos UI).
    - **URL**: `${NEXT_PUBLIC_AUTHENTICATION_NODE_URL}/flow/login`
    - **Parameters**: `?return_to=${NEXT_PUBLIC_DASHBOARD_NODE_URL}` (ensures the user is sent back to the dashboard after successful login).

4.  **User Authenticates**:
    - The user completes the login or registration flow on the Ory Kratos UI.
    - Upon success, Ory Kratos sets the session cookie and redirects the user back to the `return_to` URL.

## Authorization Flow (Permissions)

Once authenticated, access to specific resources is controlled by checking permissions against Ory Keto.

1.  **Permission Check**:

    - The application uses `checkPermission` or `requirePermission` to verify access.
    - It queries the Ory Keto Permission API (`checkPermission`).

2.  **Parameters**:

    - **Namespace**: Typically `permissions` or `roles`.
    - **Object**: The resource being accessed (e.g., `dashboard`, `tenant:123`).
    - **Relation**: The action or relationship (e.g., `access`, `member`, `owner`).
    - **Subject**: The authenticated user's ID (`session.identity.id`).

3.  **Decision**:
    - **Allowed**: The request proceeds.
    - **Denied**: The user is redirected to `/unauthorised`.

## Middleware Logic

The `middleware.ts` file acts as the first line of defense:

1.  **Session Check**: Verifies if the user is logged in. Redirects to login if not.
2.  **Dashboard Access**: Checks if the user has `access` permission on the `dashboard` object.
    - `checkPermission(permission.stack.dashboard, relation.access, session.identity.id)`
3.  **Unauthorised Handling**:
    - If a user has permission but tries to access `/unauthorised`, they are redirected to `/`.
    - If a user lacks permission, they are redirected to `/unauthorised`.

## Key Files

- **`src/lib/action/authentication.ts`**: Contains core helper functions (`getSession`, `requireSession`, `checkPermission`, `requireRole`).
- **`src/middleware.ts`**: Global middleware for session and basic permission enforcement.
- **`src/ory/sdk/server/index.ts`**: Configuration for the Ory Server SDK.
