# Vendor research for TrustExam Pro

## Identity document and liveness verification

**Provisional primary: Veriff**, after confirming Rwanda-based account eligibility and testing the flow in TrustExam’s Tauri builds. Its country matrix, public price, hosted/web integration, webhook and document-only option are relatively clear. **Backup: Smile ID** for its Africa-specific document lists and non-biometric option; obtain written pricing, sandbox, DPA and data-region details first. [7] [8] [9] [10] [11] [12] [1] [2] [3] [4] [5] [6]

| Provider | Target-market coverage | Liveness, flow, price and test | Data/transfer evidence |
|---|---|---|---|
| Smile ID | RW: passport, national/consular/diplomat and resident IDs, licence, travel document; KE: alien, Maisha Namba/national ID, licence, passport, resident/foreigner, travel; NG: national ID, licence, passport, registration, resident, travel, voter; ZA: ID, passport, resident, licence, seaman, travel; GH: Ghana Card/ECOWAS/national ID, licence, passport, health, registration, resident, seaman/social, travel, voter. [1] [4] | Selfie/liveness plus a separate identifier check without selfie; Hosted Web/callback. Price and sandbox unverified; Tauri unspecified. [2] [3] [4] [5] | DPA link did not expose terms; region and safeguards unverified. [6] |
| Veriff | Passport/ID/licence listed in all five markets; residence permits in Rwanda, Kenya and Ghana. [7] | Selfie/liveness and document-only options; web/hosted SDK/webhook. Essential $0.80/check, $49 monthly minimum; 15-day trial. [8] [9] [10] | Ireland/EEA storage; processing may be EEA, UK, US or Brazil. DPA cites SCC/adequacy mechanisms, not Rwanda approval. [11] [12] |
| Persona | Claims 200+ countries; exact five-market document matrix unverified. [13] | Optional selfie comparison; named non-biometric route unverified. Embedded/hosted SDK, sandbox/webhooks; $250/month, 12-month minimum; per-check price unpublished. [14] [15] | US or EU storage selectable; DPA transfer terms unverified. [16] |
| Onfido (Entrust) | Identity Enhanced supports Kenya, Nigeria, South Africa; Rwanda/Ghana marked unsupported, not a verdict on every product. Exact document rows unavailable. [17] [18] | Web SDK captures photo/video; sample-document sandbox/webhooks. No document-only option verified; price unpublished. [19] | DPA/SCC resources published; retention contractual; region unverified. [20] [21] |
| Sumsub | Global selector: 220+ countries/14,000+ documents; target rows unavailable. Non-Doc: Kenya/Nigeria/South Africa; Ghana coming soon; Rwanda not listed. [22] [26] | ID, biometric methods; WebSDK/webhooks/sandbox (500 applicants/day). Basic $1.35/check, $149/month minimum; 14-day trial/50 free checks. [23] [24] | Requested LDP v2 regions: US/UAE/Singapore; no Africa region or public DPA verified. [25] |
| Didit | Global 220+ country claim; exact target-country rows unverified. [27] | ID-only $0.15; passive liveness $0.10; full KYC $0.33, no minimum/500 free monthly; $10 credit model announced for 1 Nov 2026. SDK/redirect/webhook; sandbox unverified; mobile WebView docs do not cover Tauri. [28] [29] [30] | EEA infrastructure and SCC/UK IDTA/adequacy; default retention unlimited unless shortened. [31] [32] |
| VerifyAfrica | Claims all 54 African countries; general document types only, country-specific IDs unavailable. [33] | REST/mobile SDK; liveness, browser SDK, webhooks, price and sandbox unverified. [33] | Region, DPA and transfer safeguards not stated. [33] |

No reviewed provider certifies Tauri desktop WebView camera compatibility. Test camera permission, capture and return links on Windows/macOS; keep a hosted redirect/manual-ID fallback. [9] [14] [19] [29]

## Code signing

**Provisional Windows route: SSL.com OV + eSigner**, only after written confirmation it will issue to a Rwanda company; **backup: DigiCert KeyLocker**, subject to eligibility and a clear quote. The 2,000 exam-session forecast is not a signing-volume estimate. Keep Apple Developer ID as a separate founder-led macOS enrollment. [34] [35] [36] [39] [40] [41] [52] [53]

| Route | Eligibility, price and CI | Data and transfer |
|---|---|---|
| SSL.com OV/eSigner | $129/year + $180/year Tier 1 (240 signings); validation estimate 3–5 business days. GitHub Actions guide; new OV starts without SmartScreen reputation. Rwanda eligibility unverified. [34] [35] [36] [37] | Policy allows US/overseas processing; no product region or public DPA identified. [38] |
| DigiCert KeyLocker | Country selector includes Rwanda but is not eligibility proof; page shows ambiguous $44/month and $696 total. Validation and GitHub Actions documented. [39] [40] [41] | CertCentral code-signing data: US; Software Trust Manager lists US/NL/CH/JP/AU. SCC/DPF and DPA materials published. [42] [43] |
| GlobalSign OV | Europe/Africa order route; Rwanda unsupported-country status must be confirmed; numeric price unavailable. [44] [45] | Worldwide transfers and SCC/other safeguards; product region unverified. [46] |
| Microsoft Artifact Signing | Rwanda absent from Public Trust eligibility. Basic $9.99/month for 5,000 signatures, then $0.005/signature; Windows GitHub Action. [47] [48] [49] [50] | Microsoft DPA describes international processing/SCC/DPF; product residency unverified. [58] |
| Apple Developer ID | Organization, D-U-N-S, authority, domain email and website required; $99/year. Founder should check/request a D-U-N-S from D&B (up to 5 business days); Apple sync may take 2, with no review SLA. [52] [53] | Enrollment region/specific transfer basis not stated. Founder/authorized person should control Account Holder and certificate. [54] [55] [56] |
| Cloud HSM | SSL.com lists $1,200 AWS ceremony or $500 Azure/Google attestation; AWS bills running HSM hourly. SSL eSigner and DigiCert KeyLocker have GitHub Actions guides; direct CI for each BYO-HSM route was not verified. [57] [51] [37] [41] | HSM region does not determine the CA’s identity-record location; review issuer terms. [38] [43] [46] |

## Transactional email

**Primary: Amazon SES** for published cost and a Cape Town API endpoint; **backup: Brevo** if EU database hosting is preferred. Neither is recommended on Africa-specific deliverability: the independent benchmark reviewed is not country-segmented. [61] [62] [63] [64] [65] [66] [67] [68] [69] [70] [71] [72] [73] [74] [75]

| Provider | 10k / 100k emails monthly | Region, transfer and caveat |
|---|---:|---|
| Amazon SES | $1 / $10 at $0.10/1,000, excluding add-ons. [66] | Cape Town API and EU regions; no Cape Town SMTP. New accounts: sandbox, 200/day to verified recipients; production access reviewed. Regional endpoints do not establish EU-only processing. [67] [68] [69] [74] |
| Resend | $20 / $35 Pro tiers. [59] | Ireland sending, but US data storage; DPA/SCC and DPF cited. [60] [61] |
| Postmark | $15 / $177 Basic, including overage. [62] [63] | US servers, no EU option planned; new-customer DPA includes SCCs. [64] [65] |
| Brevo | €14 / €70 Starter email-credit tiers. [70] | EU database locations stated, but policy permits US/India transfers under safeguards. [71] [72] [73] |

## WhatsApp Business API

**Primary: Meta Cloud API direct** for one TrustExam-owned sender; **backup: Twilio** where managed onboarding and documented WhatsApp-to-SMS fallback justify its $0.005/message fee plus Meta charges. For client-owned numbers, assess 360dialog’s partner plan. Exact current Meta rate-card cells for Rwanda/Kenya/Nigeria were not readable; no category rate is guessed. [76] [77] [79] [83]

| Provider | Fee and country pricing | Onboarding and data/transfer |
|---|---|---|
| Meta direct | Per delivered category/market; Rwanda and Kenya map to Rest of Africa, Nigeria separate. USD card effective 1 Oct 2026; exact cells unverified. [76] | Business portfolio and phone registration required. African local-storage choices: South Africa/Bahrain; default US storage and international processing. [84] [85] [86] [87] [88] [89] |
| Twilio | $0.005 inbound/outbound plus Meta fee; country CSV is undated. [77] [78] | WhatsApp-to-SMS fallback documented; DPA has transfer terms, not local residency proof. [83] [92] |
| 360dialog | €49/$59 per number/month plus Meta fees; partner-plan fees differ. [79] [80] | Meta storage rules apply; architecture/security documented, DPA linked but not reviewed. [90] [91] |
| Africa’s Talking | $85 setup + $50/month; $0.002 Service fee stated, but other category headers/Meta pass-through unclear. [81] | SMS prices published separately; no WhatsApp fallback verified. Generic transfer safeguards; region/instrument unstated. [82] [93] [94] |

Meta verification needs an eligible portfolio and matching company details; review may take up to 14 business days. Phone registration requires ownership verification and a PIN. Keep identity documents, answers and proctoring media out of WhatsApp. [85] [86] [88] [89]

## Rwanda cross-border data transfers

Law No. 058/2021 distinguishes Article 48 transfer grounds, Article 49 written party-responsibility contracts and Article 50 offshore-storage authorization. The DPO materials require destination disclosure and describe certificate changes/15-working-day notification; its FAQ says post-registration Article 48(2)–(3) transfers require a certificate-change request. The transfer form asks for recipients, purpose, safeguards, contracts, DPIA and data-flow details; DPO publishes an Article 49 SCC and a separate offshore-storage service. [95] [96] [97] [98] [99] [100] [101] [102]

A vendor DPA/SCC does not itself prove Rwanda authorization or storage approval. Have Rwandan counsel reconcile the FAQ process with the statute and assess each subprocessor, access location, transfer ground and biometric data class before production. This is issue-spotting, not legal advice. [95] [96] [98] [100] [101] [102]

## References

[1]: https://docs.usesmileid.com/id-coverage/verify-with-document/africa "Smile ID Africa document coverage (accessed 2026-10-14)"
[2]: https://docs.usesmileid.com/products/onboarding-with-biometrics "Smile ID onboarding with biometrics (accessed 2026-10-14)"
[3]: https://docs.usesmileid.com/products/onboarding-without-biometrics "Smile ID onboarding without biometrics (accessed 2026-10-14)"
[4]: https://smile.id/countries/south-africa "Smile ID South Africa product page (accessed 2026-10-14)"
[5]: https://usesmileid.com/pricing "Smile ID pricing (accessed 2026-10-14)"
[6]: https://staging.usesmileid.com/legal/data-processing-agreement/ "Smile ID Data Processing Agreement (accessed 2026-10-14)"
[7]: https://www.veriff.com/supported-countries "Veriff supported countries (accessed 2026-10-14)"
[8]: https://www.veriff.com/plans/self-serve "Veriff self-serve pricing (accessed 2026-10-14)"
[9]: https://devdocs.veriff.com/docs/sdk-guide "Veriff SDK guide (accessed 2026-10-14)"
[10]: https://devdocs.veriff.com/docs/document-only-idv "Veriff document-only ID verification (accessed 2026-10-14)"
[11]: https://www.veriff.com/data-processing-addendum/ver-dpa-2303 "Veriff Data Processing Addendum (accessed 2026-10-14)"
[12]: https://help.veriff.com/s/article/Sub-processors-used-by-Veriff "Veriff subprocessor locations (accessed 2026-10-14)"
[13]: https://withpersona.com/product/verifications/government-id "Persona government ID verification (accessed 2026-10-14)"
[14]: https://docs.withpersona.com/tutorial-embedded-flow-inquiry-template "Persona embedded web flow (accessed 2026-10-14)"
[15]: https://withpersona.com/pricing/ "Persona pricing (accessed 2026-10-14)"
[16]: https://withpersona.com/privacy "Persona privacy policy (accessed 2026-10-14)"
[17]: https://documentation.identity.entrust.com/guide/supported-applicant-countries/ "Entrust Identity Enhanced supported countries (accessed 2026-10-14)"
[18]: https://www.entrust.com/products/identity-verification/document-verification/supported-documents "Entrust supported identity documents (accessed 2026-10-14)"
[19]: https://documentation.identity.entrust.com/sdk/web/ "Entrust Onfido Web SDK (accessed 2026-10-14)"
[20]: https://www.entrust.com/legal-compliance/data-privacy "Entrust data privacy and DPA resources (accessed 2026-10-14)"
[21]: https://onfido.my.site.com/clientportal/s/article/Data-sharing-and-Storage "Onfido data sharing and storage (accessed 2026-10-14)"
[22]: https://docs.sumsub.com/docs/supported-documents-and-countries "Sumsub supported documents and countries (accessed 2026-10-14)"
[23]: https://sumsub.com/pricing/ "Sumsub pricing (accessed 2026-10-14)"
[24]: https://docs.sumsub.com/docs/test-in-sandbox "Sumsub sandbox testing (accessed 2026-10-14)"
[25]: https://docs.sumsub.com/docs/local-data-processing "Sumsub local data processing (accessed 2026-10-14)"
[26]: https://sumsub.com/non-doc-verification/ "Sumsub non-document verification countries (accessed 2026-10-14)"
[27]: https://docs.didit.me/core-technology/id-verification/supported-documents-id-verification "Didit supported ID documents (accessed 2026-10-14)"
[28]: https://didit.me/pricing/ "Didit pricing (accessed 2026-10-14)"
[29]: https://docs.didit.me/integration/web-sdks/overview "Didit web SDKs and WebView notes (accessed 2026-10-14)"
[30]: https://docs.didit.me/integration/webhooks "Didit webhooks (accessed 2026-10-14)"
[31]: https://didit.me/terms/business/ "Didit business terms and DPA (accessed 2026-10-14)"
[32]: https://didit.me/terms/verification-privacy-notice/ "Didit verification privacy notice (accessed 2026-10-14)"
[33]: https://verifyafrica.io/features/identity-verification "VerifyAfrica identity verification (accessed 2026-10-14)"
[34]: https://www.ssl.com/products/software-integrity/code-signing/ov/ "SSL.com OV code signing (accessed 2026-10-14)"
[35]: https://www.ssl.com/guide/esigner-pricing-for-code-signing/ "SSL.com eSigner pricing (accessed 2026-10-14)"
[36]: https://www.ssl.com/how-to/ordering-process-for-code-and-document-signing-certificates/ "SSL.com certificate order process (accessed 2026-10-14)"
[37]: https://www.ssl.com/how-to/cloud-code-signing-integration-with-github-actions/ "SSL.com GitHub Actions signing (accessed 2026-10-14)"
[38]: https://www.ssl.com/privacy-policy/ "SSL.com privacy policy (accessed 2026-10-14)"
[39]: https://www.digicert.com/signing/code-signing-certificates "DigiCert code-signing products and pricing (accessed 2026-10-14)"
[40]: https://docs.digicert.com/en/certcentral/order-and-manage-certificates/request-certificates/request-a-code-signing-or-ev-code-signing-certificate/request-code-signing-certificate.html "DigiCert certificate validation (accessed 2026-10-14)"
[41]: https://docs.digicert.com/en/digicert-keylocker/ci-cd-integrations-and-deployment-pipelines/plugins/github/binary-signing-using-github-actions.html "DigiCert GitHub Actions signing (accessed 2026-10-14)"
[42]: https://www.digicert.com/privacy-center "DigiCert privacy center (accessed 2026-10-14)"
[43]: https://www.digicert.com/content/dam/digicert/pdfs/legal/digicert-customer-data-storage.pdf "DigiCert customer data locations (accessed 2026-10-14)"
[44]: https://shop.globalsign.com/en/code-signing "GlobalSign code-signing shop (accessed 2026-10-14)"
[45]: https://www.globalsign.com/support/ordering-guides/codesigningvalidation.pdf "GlobalSign code-signing validation guide (accessed 2026-10-14)"
[46]: https://www.globalsign.com/en/repository/GlobalSign-Privacy-Policy.pdf "GlobalSign privacy policy (accessed 2026-10-14)"
[47]: https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart "Microsoft Artifact Signing eligibility (accessed 2026-10-14)"
[48]: https://azure.microsoft.com/en-us/pricing/details/artifact-signing/ "Microsoft Artifact Signing pricing (accessed 2026-10-14)"
[49]: https://github.com/Azure/artifact-signing-action "Microsoft Artifact Signing GitHub Action (accessed 2026-10-14)"
[50]: https://learn.microsoft.com/en-us/azure/artifact-signing/faq "Microsoft Artifact Signing FAQ (accessed 2026-10-14)"
[51]: https://aws.amazon.com/cloudhsm/pricing/ "AWS CloudHSM pricing (accessed 2026-10-14)"
[52]: https://developer.apple.com/help/account/membership/program-enrollment/ "Apple Developer Program enrollment (accessed 2026-10-14)"
[53]: https://developer.apple.com/help/account/membership/D-U-N-S/ "Apple D-U-N-S requirements (accessed 2026-10-14)"
[54]: https://developer.apple.com/support/privacy/ "Apple Developer Program privacy (accessed 2026-10-14)"
[55]: https://developer.apple.com/help/account/certificates/create-developer-id-certificates/ "Apple Developer ID certificates (accessed 2026-10-14)"
[56]: https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution "Apple notarization documentation (accessed 2026-10-14)"
[57]: https://www.ssl.com/guide/supported-cloud-hsms-document-signing-ev-code-signing/ "SSL.com cloud HSM support and attestation (accessed 2026-10-14)"
[58]: https://www.microsoft.com/licensing/docs/documents/download/MicrosoftProductandServicesDPA%28WW%29%28English%29%28May2026%29%28CR%29.docx "Microsoft Products and Services DPA, May 2026 (accessed 2026-10-14)"
[59]: https://resend.com/pricing "Resend pricing (accessed 2026-10-14)"
[60]: https://resend.com/security/gdpr "Resend GDPR and DPA (accessed 2026-10-14)"
[61]: https://resend.com/docs/dashboard/domains/regions "Resend sending regions (accessed 2026-10-14)"
[62]: https://postmarkapp.com/pricing "Postmark pricing (accessed 2026-10-14)"
[63]: https://postmarkapp.com/support/article/1107-how-does-monthly-pricing-work "Postmark monthly pricing and overages (accessed 2026-10-14)"
[64]: https://postmarkapp.com/eu-privacy "Postmark EU data protection and hosting (accessed 2026-10-14)"
[65]: https://postmarkapp.com/dpa "Postmark Data Processing Addendum (accessed 2026-10-14)"
[66]: https://aws.amazon.com/ses/pricing/ "Amazon SES pricing (accessed 2026-10-14)"
[67]: https://docs.aws.amazon.com/general/latest/gr/ses.html "Amazon SES endpoints and quotas (accessed 2026-10-14)"
[68]: https://docs.aws.amazon.com/ses/latest/dg/regions.html "Amazon SES regions (accessed 2026-10-14)"
[69]: https://aws.amazon.com/compliance/eu-data-protection/ "AWS EU data protection (accessed 2026-10-14)"
[70]: https://www.brevo.com/pricing.md "Brevo pricing catalog (accessed 2026-10-14)"
[71]: https://help.brevo.com/hc/en-us/articles/360001005510-Data-storage-location "Brevo data storage locations (accessed 2026-10-14)"
[72]: https://www.brevo.com/legal/termsofuse/ "Brevo Terms of Service and DPA (accessed 2026-10-14)"
[73]: https://www.brevo.com/legal/privacypolicy/ "Brevo privacy policy and transfers (accessed 2026-10-14)"
[74]: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html "Amazon SES production-access request (accessed 2026-10-14)"
[75]: https://unspam.email/articles/email-deliverability-report "2026 Unspam deliverability benchmark (accessed 2026-10-14)"
[76]: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing "Meta WhatsApp Platform pricing and rate card (accessed 2026-10-14)"
[77]: https://www.twilio.com/en-us/whatsapp/pricing "Twilio WhatsApp pricing (accessed 2026-10-14)"
[78]: https://www.twilio.com/content/dam/twilio-com/pricing-data/en/WhatsAppPricing-pricing-details.csv "Twilio WhatsApp country fee CSV (accessed 2026-10-14)"
[79]: https://360dialog.com/pricing "360dialog WhatsApp pricing (accessed 2026-10-14)"
[80]: https://docs.360dialog.com/docs/get-started/pricing "360dialog pricing documentation (accessed 2026-10-14)"
[81]: https://africastalking.com/chat/whatsapp "Africa's Talking WhatsApp API pricing (accessed 2026-10-14)"
[82]: https://africastalking.com/pricing "Africa's Talking SMS pricing (accessed 2026-10-14)"
[83]: https://www.twilio.com/docs/bulk-messaging/channel-fallback "Twilio channel fallback documentation (accessed 2026-10-14)"
[84]: https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started "Meta WhatsApp Cloud API setup (accessed 2026-10-14)"
[85]: https://www.facebook.com/business/help/2058515294227817 "Meta business verification help (accessed 2026-10-14)"
[86]: https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration "Meta business phone registration (accessed 2026-10-14)"
[87]: https://developers.facebook.com/documentation/business-messaging/whatsapp/local-storage "Meta WhatsApp local storage (accessed 2026-10-14)"
[88]: https://www.whatsapp.com/legal/business-data-processing-terms "WhatsApp Business Data Processing Terms (accessed 2026-10-14)"
[89]: https://www.whatsapp.com/legal/DTA "WhatsApp Business Global Data Transfer Addendum (accessed 2026-10-14)"
[90]: https://docs.360dialog.com/partner/onboarding/integration-best-practices/architecture-and-security "360dialog architecture and security (accessed 2026-10-14)"
[91]: https://docs.360dialog.com/docs/support/legal-information "360dialog legal information (accessed 2026-10-14)"
[92]: https://www.twilio.com/en-us/legal/data-protection-addendum "Twilio Data Protection Addendum (accessed 2026-10-14)"
[93]: https://africastalking.com/privacy_policy "Africa's Talking privacy policy (accessed 2026-10-14)"
[94]: https://developers.africastalking.com/docs/sms/overview "Africa's Talking SMS developer guide (accessed 2026-10-14)"
[95]: https://cyber.gov.rw/fileadmin/user_upload/NCSA/Documents/Laws/OG_Special_of_15.10.2021_Amakuru_bwite.pdf "Official Gazette: Rwanda Law No. 058/2021 (accessed 2026-10-14)"
[96]: https://dpo.gov.rw/dpp-law/sharing-transferstorage-and-retention-of-personal-data "Rwanda DPO: transfer, storage and retention rules (accessed 2026-10-14)"
[97]: https://dpo.gov.rw/dpp-law/registration-of-a-data-controller-and-a-data-processor "Rwanda DPO: controller and processor registration (accessed 2026-10-14)"
[98]: https://dpo.gov.rw/faqs "Rwanda DPO FAQs (accessed 2026-10-14)"
[99]: https://dpo.gov.rw/fileadmin/DPO/ComplianceTools/registration-guide-for-data-controller-and-processor.pdf "Rwanda DPO registration guide (accessed 2026-10-14)"
[100]: https://dpo.gov.rw/fileadmin/DPO/Services/application-form-for-external-transfer-authorization.pdf "Rwanda DPO external-transfer authorization form (accessed 2026-10-14)"
[101]: https://dpo.gov.rw/fileadmin/DPO/ComplianceTools/Standard%20Contractual%20Clauses%20for%20Transfer%20Personal%20Data%20Outside%20Rwanda_.pdf "Rwanda DPO standard contractual clauses (accessed 2026-10-14)"
[102]: https://dpo.gov.rw/services/authorization-to-store-outside-rwanda "Rwanda DPO offshore-storage authorization (accessed 2026-10-14)"
