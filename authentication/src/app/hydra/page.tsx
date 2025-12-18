'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HYDRA_PUBLIC_URL = process.env.NEXT_PUBLIC_HYDRA_PUBLIC_URL;
const HYDRA_CLIENT_ID = process.env.NEXT_PUBLIC_HYDRA_OAUTH2_CLIENT_ID;
const HYDRA_REDIRECT_URI = process.env.NEXT_PUBLIC_HYDRA_OAUTH2_REDIRECT_URL;
const HYDRA_SCOPES = process.env.NEXT_PUBLIC_HYDRA_OAUTH2_SCOPES ?? 'openid offline';

function buildAuthorizationUrl() {
    if (!HYDRA_PUBLIC_URL || !HYDRA_CLIENT_ID || !HYDRA_REDIRECT_URI) {
        return null;
    }

    const url = new URL('/oauth2/auth', HYDRA_PUBLIC_URL);
    const state = `state-${Date.now()}`;
    const nonce = `nonce-${Date.now()}`;

    url.searchParams.set('client_id', HYDRA_CLIENT_ID);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', HYDRA_SCOPES);
    url.searchParams.set('redirect_uri', HYDRA_REDIRECT_URI);
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);

    return url.toString();
}

export default function HydraStartPage() {
    const authUrl = buildAuthorizationUrl();
    const misconfigured = !authUrl;

    const handleStart = () => {
        console.log("data configured", HYDRA_PUBLIC_URL, HYDRA_CLIENT_ID, HYDRA_REDIRECT_URI, HYDRA_SCOPES);
        console.log("authUrl", authUrl)
        if (!authUrl) return;
        window.location.href = authUrl;
    };

    return (
        <Card className="flex flex-col size-full justify-center items-center p-4">
            <CardHeader className="flex flex-col space-y-2 text-center">
                <CardTitle>Hydra OAuth2 Test</CardTitle>
                <CardDescription>
                    Start an OAuth2 Authorization Code flow against Ory Hydra and return here with tokens.
                </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex flex-col space-y-4">
                {misconfigured && (
                    <p className="text-sm text-red-500">
                        Missing Hydra configuration. Please set NEXT_PUBLIC_HYDRA_PUBLIC_URL,
                        NEXT_PUBLIC_HYDRA_OAUTH2_CLIENT_ID and NEXT_PUBLIC_HYDRA_OAUTH2_REDIRECT_URL.
                    </p>
                )}
                <Button onClick={handleStart} disabled={misconfigured} className="w-full">
                    Start Hydra Authentication
                </Button>
            </CardContent>
        </Card>
    );
}
