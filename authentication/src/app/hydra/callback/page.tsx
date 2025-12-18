'use server';

import React from 'react';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getOAuth2PublicApi, getOAuth2Api } from '@/ory/sdk/server';

const HYDRA_PUBLIC_URL = process.env.ORY_HYDRA_PUBLIC_URL ?? process.env.HYDRA_PUBLIC_URL ?? 'http://127.0.0.1:4444';
const HYDRA_CLIENT_ID = process.env.HYDRA_OAUTH2_CLIENT_ID;
const HYDRA_CLIENT_SECRET = process.env.HYDRA_OAUTH2_CLIENT_SECRET;
const HYDRA_REDIRECT_URI = process.env.HYDRA_OAUTH2_REDIRECT_URL ?? 'http://localhost:3000/hydra/callback';

function decodeJwtPayload(token?: string | null): any | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
        const payload = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
        const json = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export default async function HydraCallbackPage(props: { searchParams: Promise<{ code?: string; state?: string; error?: string; error_description?: string }> }) {
    const searchParams = await props.searchParams;
    const { code, error, error_description } = searchParams;

    if (error) {
        return (
            <Card className="flex flex-col items-center w-full max-w-xl p-4">
                <CardHeader className="text-center space-y-2">
                    <CardTitle>Hydra Callback Error</CardTitle>
                    <CardDescription>{error}: {error_description}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!code) {
        return redirect('/hydra');
    }

    if (!HYDRA_CLIENT_ID || !HYDRA_CLIENT_SECRET) {
        return (
            <Card className="flex flex-col items-center w-full max-w-xl p-4">
                <CardHeader className="text-center space-y-2">
                    <CardTitle>Hydra OAuth2 Not Configured</CardTitle>
                    <CardDescription>
                        HYDRA_OAUTH2_CLIENT_ID and HYDRA_OAUTH2_CLIENT_SECRET must be set on the server to exchange the
                        authorization code for tokens.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Use Ory SDK for token exchange
    const hydra = await getOAuth2PublicApi();
    const hydraAdmin = await getOAuth2Api();
    let tokenJson: any;
    let tokenResponse: { status: number };

    try {
        const response = await hydra.oauth2TokenExchange({
            grantType: 'authorization_code',
            code: code,
            redirectUri: HYDRA_REDIRECT_URI,
            clientId: HYDRA_CLIENT_ID,
        }, {
            auth: {
                username: HYDRA_CLIENT_ID,
                password: HYDRA_CLIENT_SECRET,
            },
        });

        tokenJson = response.data;
        tokenResponse = { status: response.status };
    } catch (error: any) {
        tokenJson = error.response?.data || { error: 'token_exchange_failed', error_description: error.message };
        tokenResponse = { status: error.response?.status || 500 };
    }

    if (tokenResponse.status !== 200) {
        return (
            <Card className="flex flex-col items-center w-full max-w-xl p-4">
                <CardHeader className="text-center space-y-2">
                    <CardTitle>Token Exchange Failed</CardTitle>
                    <CardDescription>
                        {tokenJson.error}: {tokenJson.error_description}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const idTokenPayload = decodeJwtPayload(tokenJson.id_token);

    let userInfo: any | null = null;
    try {
        const userInfoResponse = await fetch(`${HYDRA_PUBLIC_URL.replace(/\/$/, '')}/userinfo`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${tokenJson.access_token}`,
            },
        });

        if (userInfoResponse.ok) {
            userInfo = await userInfoResponse.json();
        }
    } catch (e) {
        userInfo = null;
    }

    return (
        <Card className="flex flex-col items-start w-full max-w-2xl p-4 space-y-4">
            <CardHeader className="space-y-2">
                <CardTitle>Hydra Session Details</CardTitle>
                <CardDescription>
                    Tokens returned from Hydra for the current OAuth2 session.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 w-full">
                <div>
                    <h3 className="font-semibold text-sm mb-1">Access Token</h3>
                    <pre className="whitespace-pre-wrap break-all text-xs bg-muted p-2 rounded">
                        {tokenJson.access_token}
                    </pre>
                </div>
                <div>
                    <h3 className="font-semibold text-sm mb-1">ID Token</h3>
                    <pre className="whitespace-pre-wrap break-all text-xs bg-muted p-2 rounded">
                        {tokenJson.id_token}
                    </pre>
                </div>
                {idTokenPayload && (
                    <div>
                        <h3 className="font-semibold text-sm mb-1">ID Token Claims (decoded)</h3>
                        <pre className="whitespace-pre-wrap break-words text-xs bg-muted p-2 rounded">
                            {JSON.stringify(idTokenPayload, null, 2)}
                        </pre>
                    </div>
                )}
                {userInfo && (
                    <div>
                        <h3 className="font-semibold text-sm mb-1">Profile (Userinfo)</h3>
                        <pre className="whitespace-pre-wrap break-words text-xs bg-muted p-2 rounded">
                            {JSON.stringify(userInfo, null, 2)}
                        </pre>
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-sm mb-1">Scope</h3>
                    <pre className="whitespace-pre-wrap break-all text-xs bg-muted p-2 rounded">
                        {tokenJson.scope}
                    </pre>
                </div>
                <div>
                    <h3 className="font-semibold text-sm mb-1">Raw Token Response</h3>
                    <pre className="whitespace-pre-wrap break-words text-xs bg-muted p-2 rounded">
                        {JSON.stringify(tokenJson, null, 2)}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
}
