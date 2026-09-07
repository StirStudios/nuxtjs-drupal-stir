# Drupal-owned random ordering

Stir Tools now supports time-windowed random ordering for Views and media, defaulting to 600 seconds. Configure the rotation in Drupal's rotating Views sort or media formatter. The layer does not shuffle content or choose the interval.

View CE payloads may include `randomOrder: { key, value }`. Shared View controls validate and forward this opaque pagination state in requests, links and saved View state, including when the URL's normal View controls are namespaced. It preserves the original order across a rotation boundary. Older Drupal responses without this property continue working.

Deploy this layer support before or alongside the Stir Tools change. Rebuild Drupal's service/plugin cache after installing the backend. Refreshing a URL with a retained order token intentionally retains that order; a fresh URL joins the current interval. Membership can still change when content, access or filters change.

Media needs no frontend token: Drupal supplies a stable selection for each interval. No wrappers, client-side randomization or additional startup request are introduced for ordinary unfiltered first-page visits.

DancePlug's override uses the shared DrupalViewProps and useDrupalViewControls; it inherits token transport. Its separate daily listing services retain their existing policy.
