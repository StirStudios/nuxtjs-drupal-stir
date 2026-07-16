# Integrations Layer

`layers/integrations` owns the optional popup and privacy-notice UI together
with the consent policy consumed by analytics and trusted third-party scripts.
It is excluded from the minimal preset and included by the full compatibility
preset.

Downstream projects configure the public `popup` and `privacyNotice` app-config
keys as before. The base theme provides only an empty application mount and a
neutral script-permission fallback so it does not register or ship the optional
integration implementation.
