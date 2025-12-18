'use server';

import { Configuration, FrontendApi, OAuth2Api } from '@ory/client';


// ####################################################################################
// OAuth2 API
// ####################################################################################

const oAuth2Api = new OAuth2Api(new Configuration(
    {
        basePath: process.env.ORY_HYDRA_ADMIN_URL,
        baseOptions: {
            withCredentials: true,
        },
    },
));

export async function getOAuth2Api() {
    return oAuth2Api;
}

// OAuth2 Public API for token exchange (uses public endpoint)
const oAuth2PublicApi = new OAuth2Api(new Configuration(
    {
        basePath: process.env.ORY_HYDRA_PUBLIC_URL ?? process.env.HYDRA_PUBLIC_URL ?? 'http://127.0.0.1:4444',
        baseOptions: {
            withCredentials: false,
        },
    },
));

export async function getOAuth2PublicApi() {
    return oAuth2PublicApi;
}


// ####################################################################################
// Frontend API
// ####################################################################################

const frontendApi = new FrontendApi(
    new Configuration({
        basePath: process.env.NEXT_PUBLIC_ORY_KRATOS_URL,
        baseOptions: {
            withCredentials: true,
        },
    }),
);

export async function getFrontendApi() {
    return frontendApi;
}
