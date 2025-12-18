'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Api } from '@/ory/sdk/server';

export async function POST(request: NextRequest) {
    const { challenge } = await request.json();

    if (!challenge) {
        return NextResponse.json({ error: 'missing_consent_challenge' }, { status: 400 });
    }

    const hydra = await getOAuth2Api();

    const { data } = await hydra.rejectOAuth2ConsentRequest({
        consentChallenge: challenge,
    });

    return NextResponse.json({ redirect_to: data.redirect_to });
}
