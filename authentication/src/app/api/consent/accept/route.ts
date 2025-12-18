'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Api } from '@/ory/sdk/server';

export async function POST(request: NextRequest) {
    const { challenge, scopes, profile } = await request.json();

    if (!challenge) {
        return NextResponse.json({ error: 'missing_consent_challenge' }, { status: 400 });
    }

    const hydra = await getOAuth2Api();

    // Map the incoming Kratos session into Hydra's expected session structure.
    const subject = profile?.identity?.id;
    const traits = profile?.identity?.traits ?? {};

    const session: any | undefined = subject
        ? {
            id_token: {
                sub: subject,
                ...traits,
            },
            access_token: {
                sub: subject,
            },
        }
        : undefined;

    const acceptBody: any = {
        grant_scope: scopes ?? [],
        // Force consent each time: do not remember decisions.
        remember: false,
        remember_for: 0,
    };

    if (session) {
        acceptBody.session = session;
    }

    const { data } = await hydra.acceptOAuth2ConsentRequest({
        consentChallenge: challenge,
        acceptOAuth2ConsentRequest: acceptBody,
    });

    return NextResponse.json({ redirect_to: data.redirect_to });
}
