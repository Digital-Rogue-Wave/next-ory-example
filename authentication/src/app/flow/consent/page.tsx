'use server';

import React from 'react';
import { Card } from '@/components/ui/card';
import { OAuth2ConsentRequest } from '@ory/client';
import ConsentForm from '@/components/consentForm';
import { getOAuth2Api } from '@/ory/sdk/server';

export default async function Consent(props: { searchParams: Promise<{ consent_challenge: string }> }) {

    const searchParams = await props.searchParams;

    const consentChallenge = searchParams.consent_challenge ?? undefined;
    let consentRequest: OAuth2ConsentRequest | undefined = undefined;

    if (!consentChallenge) {
        return;
    }

    const hydra = await getOAuth2Api();
    await hydra
        .getOAuth2ConsentRequest({ consentChallenge })
        .then(({ data }) => {
            // Always show consent UI, even if Hydra indicates the request could be skipped.
            consentRequest = data;
        });

    if (!consentRequest) {
        return;
    }

    return (
        <Card className="flex flex-col items-center w-full max-w-sm p-4">
            <ConsentForm
                request={consentRequest}
            />
        </Card>
    );
}
