"use server";

import { Consent } from "@ory/elements-react/theme";
import config from "@/ory/ory.config";
import { redirect } from "next/navigation";
import { getServerSession } from "@ory/nextjs/app";
import { getOAuth2Api } from "@/ory/sdk/server";

export default async function ConsentPage(props: {
  searchParams: Promise<{ consent_challenge: string }>;
}) {
  const searchParams = await props.searchParams;
  const consentChallenge = searchParams.consent_challenge;

  if (!consentChallenge) {
    return redirect("/flow/login");
  }

  const session = await getServerSession();

  if (!session) {
    redirect("/flow/login");
  }

  const hydra = await getOAuth2Api();
  const { data: consentRequest } = await hydra.getOAuth2ConsentRequest({
    consentChallenge: consentChallenge,
  });

  return (
    <Consent
      config={config}
      consentChallenge={consentRequest as any}
      session={session}
      csrfToken=''
      formActionUrl='http://localhost:3000/api/consent/accept'
      components={{
        Card: {},
      }}
    />
  );
}
