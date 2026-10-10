import {
  array,
  boolean,
  getDotPath,
  integer,
  isValiError,
  literal,
  minLength,
  minValue,
  number,
  object,
  optional,
  parse,
  picklist,
  pipe,
  string,
} from 'valibot'
import type { InferOutput } from 'valibot'
import type { AuthUiConfig } from '../../app/types/auth'
import { layerAuthDrupalApiRequest } from './drupalApi'

const text = () => string()
const requiredText = () => pipe(string(), minLength(1))
const identifierMode = () => picklist(['email', 'username', 'email_or_username'])
const basicField = () => object({
  label: text(),
  placeholder: text(),
})
const requiredField = () => object({
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
})
const validatedField = () => object({
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
  invalidMessage: text(),
})
const identifierField = () => object({
  mode: identifierMode(),
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
  invalidMessage: text(),
})
const message = () => object({
  title: text(),
  description: text(),
})

// Unknown properties are dropped rather than rejected: Stir Tools often ships a
// new field before a site updates this layer, and an extra label must not turn
// the whole config into the fallback, which reads as accounts being disabled.
const authUiConfigSchema = object({
  version: literal(2),
  accountsEnabled: optional(boolean()),
  loginRedirectPath: requiredText(),
  logoutRedirectPath: requiredText(),
  identifierModes: object({
    login: identifierMode(),
    passwordRequest: identifierMode(),
  }),
  login: object({
    title: text(),
    description: text(),
    submitLabel: text(),
    identifier: identifierField(),
    password: requiredField(),
    successToast: message(),
  }),
  register: object({
    title: text(),
    description: text(),
    submitLabel: text(),
    email: validatedField(),
    password: basicField(),
    complete: object({
      verificationTitle: text(),
      createdTitle: text(),
      verificationSentDescription: text(),
      verificationRequiredDescription: text(),
      createdDescription: text(),
    }),
  }),
  passwordRequest: object({
    title: text(),
    description: text(),
    submitLabel: text(),
    identifier: identifierField(),
    sentTitle: text(),
    sentDescription: text(),
  }),
  passwordReset: object({
    title: text(),
    description: text(),
    submitLabel: text(),
    password: basicField(),
    confirmPassword: object({
      label: text(),
      placeholder: text(),
      requiredMessage: text(),
      mismatchMessage: text(),
    }),
    checkingTitle: text(),
    unavailableTitle: text(),
    invalidLinkMessage: text(),
    expiredLinkMessage: text(),
    successToast: message(),
  }),
  verify: object({
    loadingTitle: text(),
    successTitle: text(),
    failedTitle: text(),
    loadingDescription: text(),
    invalidDescription: text(),
    successDescription: text(),
    failedDescription: text(),
  }),
  protectedPage: object({
    title: text(),
    description: text(),
    // Stir Tools before contract 1.33 sends none; the page then says Continue.
    submitLabel: optional(text()),
  }),
  passwordPolicy: object({
    minLength: pipe(number(), integer(), minValue(1)),
    maxLength: pipe(number(), integer(), minValue(1)),
    requiredMessage: text(),
    minLengthMessage: text(),
    maxLengthMessage: text(),
    lowercaseMessage: text(),
    uppercaseMessage: text(),
    numberMessage: text(),
    notSameAsCurrentMessage: text(),
    requirements: pipe(array(object({
      key: requiredText(),
      pattern: requiredText(),
      label: text(),
    })), minLength(1)),
    strengthLabels: object({
      empty: text(),
      weak: text(),
      medium: text(),
      strong: text(),
      mustContain: text(),
    }),
  }),
})

function contractError(path: string): TypeError {
  return new TypeError(`Invalid Drupal auth UI config contract at ${path}`)
}

export function parseAuthUiConfigResponse(value: unknown): AuthUiConfig {
  let config: InferOutput<typeof authUiConfigSchema>

  try {
    config = parse(authUiConfigSchema, value)
  }
  catch (error) {
    if (isValiError(error)) {
      throw contractError(getDotPath(error.issues[0]) ?? 'root')
    }
    throw error
  }

  if (config.login.identifier.mode !== config.identifierModes.login) {
    throw contractError('login.identifier.mode')
  }
  if (config.passwordRequest.identifier.mode !== config.identifierModes.passwordRequest) {
    throw contractError('passwordRequest.identifier.mode')
  }
  if (config.passwordPolicy.maxLength < config.passwordPolicy.minLength) {
    throw contractError('passwordPolicy.length')
  }

  config.passwordPolicy.requirements.forEach((requirement, index) => {
    try {
      new RegExp(requirement.pattern)
    }
    catch {
      throw contractError(`passwordPolicy.requirements.${index}.pattern`)
    }
  })

  return config as AuthUiConfig
}

export async function fetchAuthUiConfig(
  event: Parameters<typeof layerAuthDrupalApiRequest>[0],
): Promise<Partial<AuthUiConfig>> {
  try {
    const response = await layerAuthDrupalApiRequest<unknown>(
      event,
      '/api/auth/config',
      { method: 'GET' },
    )

    return parseAuthUiConfigResponse(response)
  }
  catch (error: unknown) {
    // Logged in every environment: the fallback reads as accounts being
    // disabled, so /auth pages redirect away with nothing else to show why.
    console.error(
      '[auth/config] Falling back to local auth UI config because Drupal config could not be loaded.',
      error,
    )

    return {}
  }
}
