'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Flow, HandleError, kratos } from '@/ory';
import { LoginFlow, UpdateLoginFlowBody } from '@ory/client';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { AxiosError } from 'axios'

export default function Login() {
    const router = useRouter();
    const [flow, setFlow] = useState<LoginFlow>();

    const params = useSearchParams();
    const flowId = params.get('flow') ?? undefined;
    const aal = params.get('aal') ?? undefined;
    const refresh = Boolean(params.get('refresh')) ? true : undefined;
    const returnTo = params.get('return_to') ?? undefined;
    const loginChallenge = params.get('login_challenge') ?? undefined;

    const getFlow = useCallback(async (flowId: string) => {
        try {
            const { data } = await kratos.getLoginFlow({ id: String(flowId) });
            setFlow(data);
        } catch (error) {
            handleError(error as AxiosError);
        }
    }, []);

    const handleError = useCallback((error: AxiosError) => {
        const handle = HandleError(getFlow, setFlow, '/flow/login', true, router);
        return handle(error);
    }, [getFlow]);

    const createFlow = useCallback(async (aal: string | undefined, refresh: boolean | undefined, returnTo: string | undefined, loginChallenge: string | undefined) => {
        try {
            const { data } = await kratos.createBrowserLoginFlow({ aal, refresh, returnTo, loginChallenge });
            setFlow(data);
            router.push(`?flow=${data.id}`);
        } catch (error) {
            handleError(error as AxiosError);
        }
    }, [handleError]);

    const updateFlow = async (body: UpdateLoginFlowBody) => {
        try {
            const { data }: any = await kratos.updateLoginFlow({
                flow: String(flow?.id),
                updateLoginFlowBody: body,
            });
            const continueWith = (data as any).continue_with ?? [];
            const redirect = continueWith.find((item: any) => item.action === 'redirect_browser_to');
            if (redirect?.redirect_browser_to) {
                window.location.href = redirect.redirect_browser_to;
                return;
            }
            if (data.return_to!) {
                window.location.href = data.return_to;
                return;
            }
            router.push('/');
        } catch (error) {
            handleError(error as AxiosError);
        }
    };

    useEffect(() => {
        if (flow) {
            return;
        }
        if (flowId) {
            getFlow(flowId).then();
            return;
        }
        createFlow(aal, refresh, returnTo, loginChallenge);
    }, [flowId, router, aal, refresh, returnTo, createFlow, loginChallenge, getFlow]);

    return (
        <Card className="flex flex-col items-center w-full max-w-sm p-4">
            <Image
                src="/drw-logo.png"
                width="64"
                height="64"
                alt="DRW Logo"
                className="mt-10 mb-4"
            />
            <CardHeader className="flex flex-col items-center text-center space-y-4">
                {
                    flow ?
                        <div className="flex flex-col space-y-4">
                            <CardTitle>
                                {flow?.refresh
                                    ? "Confirm Action"
                                    : flow?.requested_aal === "aal2"
                                        ? "Two-Factor Authentication"
                                        : "Welcome"}
                            </CardTitle>
                            <CardDescription className="max-w-xs">
                                Log in to the digital rogue wave ecosystem.
                            </CardDescription>
                        </div>
                        :
                        <Skeleton className="h-6 w-full rounded-md" />
                }
            </CardHeader>
            <CardContent className="w-full gap-4">
                {
                    flow ?
                        <Flow flow={flow} onSubmit={updateFlow} />
                        :
                        <div className="flex flex-col">
                            <Skeleton className="h-3 w-[80px] rounded-md" />
                            <Button disabled>
                                <Skeleton className="h-4 w-[80px] rounded-md" />
                            </Button>
                        </div>
                }
            </CardContent>
            <div className="flex flex-col">
                {
                    flow ?
                        <Button variant="link" asChild>
                            <Link
                                href={{ pathname: '/flow/recovery', query: { return_to: flow.return_to } }}
                                className="text-orange-600"
                                passHref>
                                Forgot your password?
                            </Link>
                        </Button>
                        :
                        <Skeleton className="h-3 w-[180px] rounded-md" />
                }
                {
                    flow ?
                        <Button variant="link" asChild disabled={!flow}>
                            <Link
                                href={{ pathname: '/flow/registration', query: { return_to: flow.return_to } }}
                                className="inline-flex space-x-2"
                                passHref>
                                Create an account
                            </Link>
                        </Button>
                        :
                        <Skeleton className="h-3 w-[180px] rounded-md my-3.5" />
                }
            </div>
        </Card>
    );
}
