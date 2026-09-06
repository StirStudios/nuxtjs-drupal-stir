# Backend requirements and capability ownership

This is Stir's opinionated Nuxt layer for its Drupal publishing workflow. It uses the public `nuxtjs-drupal-ce` integration and Lupus Custom Elements, and adds contracts implemented by the currently private Stir Tools Drupal project. The backend is not included or installed by the frontend package.

| Capability | What the backend must provide |
|---|---|
| Basic Custom Elements page delivery | A compatible Drupal/Lupus CE endpoint, explicit-format payloads and matching frontend element components. Generic CE transport is upstream; Stir's authored page composition is additional. |
| Shared layout blocks, footer/site context | Stir `app.context` payloads, owned by `stir_layout_block`. |
| Page-builder components and inline editing | Compatible component trees, authorized editorial read/update endpoints and media/presentation contracts; provided by Stir layout modules. Ordinary Drupal content alone does not supply this interface. |
| Presentation CSS at build time | A validated presentation-usage manifest, normally produced by `stir_layout_builder`, or a compatible reviewed snapshot. Even minimal consumers must satisfy this build requirement. |
| Account UI and workflows | Stir account configuration/session/registration/settings contracts from `stir_account`; ordinary Drupal account routes are not a substitute for these JSON contracts. |
| Webform rendering and submissions | Stir layout Webform payloads and the `stir_webform_rest` submission contract, plus configured Drupal Webforms and CAPTCHA where required. |
| Drupal-driven listings, SEO and sitemap data | The corresponding `stir_listing`, `stir_seo` and `stir_sitemap` contracts when those capabilities are enabled. |
| Theme primitives, local password gate and vendor integrations | Frontend-owned behavior; vendor credentials/settings may still be required. The local password gate is separate from Drupal user authentication. |

Drupal remains the source of truth for authored content, access and editorial settings. Nuxt consumes those decisions and owns presentation and browser behavior.

## What can run without access to Stir Tools?

The repository's deterministic E2E example runs without a real CMS. It supplies fixture data locally and verifies SSR/hydration. Unit/runtime tests and fixture consumer builds are engineering examples; they do not demonstrate that an arbitrary Drupal site supports the full stack.

The minimal preset removes editorial, Webform, account and privacy-popup capabilities, but retains Stir theme/presentation assumptions. For a generic Lupus site, evaluate the upstream [Nuxt Drupal CE module](https://github.com/drunomics/nuxtjs-drupal-ce) and provide your own element mappings, or deliberately adapt this layer to compatible payloads. Stock-Drupal compatibility is not claimed here.

To run a real Stir site, arrange access to the private backend and its configuration, or supply an independently implemented compatible backend. No automatic access, public backend distribution or support commitment is implied by this repository. The Nuxt layer is licensed under [GPL-2.0-or-later](../LICENSE); adopting it does not grant access to Stir Tools.

## Contract reference

The checked-in [contract snapshot](../contracts/stir-tools/README.md) contains schemas and examples. Its [manifest](../contracts/stir-tools/v1/manifest.json) records provider modules and the contract version. These files are build/test reference material, not an implementation of the Drupal endpoints. Backend and frontend versions need compatible contracts; they need not share release numbers.

Continue with the [consumer quickstart](consumer-quickstart.md) once backend prerequisites are satisfied.
