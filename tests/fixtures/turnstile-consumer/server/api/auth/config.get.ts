import { defineEventHandler } from 'h3'

// Stands in for Drupal's auth settings so the sign-in page renders.
export default defineEventHandler(() => ({ version: 1, accountsEnabled: true }))
