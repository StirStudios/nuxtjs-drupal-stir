// ofetch's retry statuses without 503: Drupal answers 503 in Maintenance mode,
// which lasts for a deploy, so asking again at once only adds load.
export const STIR_RETRY_STATUS_CODES = [408, 409, 425, 429, 500, 502, 504]
