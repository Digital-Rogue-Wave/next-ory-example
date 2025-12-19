"use server";

import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Api } from "@/ory/sdk/server";

import { getServerSession } from "@ory/nextjs/app";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  let body: any = {};

  try {
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    }
  } catch (e) {
    console.error("Error parsing request body:", e);
  }

  // Elements components might send 'consent_challenge' or 'challenge'
  const challenge =
    body.challenge || body.consent_challenge || body.consentChallenge;
  const scopes = body.scopes || body.grant_scope || [];

  if (!challenge) {
    return NextResponse.json(
      { error: "missing_consent_challenge" },
      { status: 400 }
    );
  }

  // Fetch session directly from the server side (cookies)
  const sessionData = (await getServerSession()) as any;

  if (!sessionData) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const hydra = await getOAuth2Api();

  const identity = sessionData.identity;
  const subject = identity.id;
  const traits = identity.traits || {};

  // Map the Kratos session into Hydra's expected session structure.
  const hydraSession: any = {
    id_token: {
      sub: subject,
      email: traits.email,
      name: traits.name,
      ...traits,
    },
    access_token: {
      sub: subject,
    },
  };

  const acceptBody: any = {
    grant_scope: scopes,
    remember: false,
    remember_for: 0,
    session: hydraSession,
  };

  const { data } = await hydra.acceptOAuth2ConsentRequest({
    consentChallenge: challenge,
    acceptOAuth2ConsentRequest: acceptBody,
  });

  return NextResponse.json({ redirect_to: data.redirect_to });
}
