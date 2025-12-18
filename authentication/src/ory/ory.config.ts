// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import type { OryClientConfiguration } from "@ory/elements-react"

const config: OryClientConfiguration = {
  project: {
    default_locale: "en",
    default_redirect_url: "/",
    error_ui_url: "/flow/error",
    locale_behavior: "force_default",
    name: "Ory Next.js App Router Example",
    registration_enabled: true,
    verification_enabled: true,
    recovery_enabled: true,
    registration_ui_url: "/flow/registration",
    verification_ui_url: "/flow/verification",
    recovery_ui_url: "/flow/recovery",
    login_ui_url: "/flow/login",
    settings_ui_url: "/flow/settings",
  },
}

export default config
