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
  optional,
  parse,
  picklist,
  pipe,
  strictObject,
  string,
} from 'valibot'
import type { InferOutput } from 'valibot'
import type { AuthUiConfig } from '../../app/types/auth'
import { layerAuthDrupalApiRequest } from './drupalApi'

const text = () => string()
const requiredText = () => pipe(string(), minLength(1))
const identifierMode = () => picklist(['email', 'username', 'email_or_username'])
const basicField = () => strictObject({
  label: text(),
  placeholder: text(),
})
const requiredField = () => strictObject({
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
})
const validatedField = () => strictObject({
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
  invalidMessage: text(),
})
const identifierField = () => strictObject({
  mode: identifierMode(),
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
  invalidMessage: text(),
})
const message = () => strictObject({
  title: text(),
  description: text(),
})

const authUiConfigSchema = strictObject({
  version: literal(2),
  accountsEnabled: optional(boolean()),
  loginRedirectPath: requiredText(),
  logoutRedirectPath: requiredText(),
  identifierModes: strictObject({
    login: identifierMode(),
    passwordRequest: identifierMode(),
  }),
  login: strictObject({
    title: text(),
    description: text(),
    submitLabel: text(),
    identifier: identifierField(),
    password: requiredField(),
    successToast: message(),
  }),
  register: strictObject({
    title: text(),
    description: text(),
    submitLabel: text(),
    email: validatedField(),
    password: basicField(),
    complete: strictObject({
      verificationTitle: text(),
      createdTitle: text(),
      verificationSentDescription: text(),
      verificationRequiredDescription: text(),
      createdDescription: text(),
    }),
  }),
  passwordRequest: strictObject({
    title: text(),
    description: text(),
    submitLabel: text(),
    identifier: identifierField(),
    sentTitle: text(),
    sentDescription: text(),
  }),
  passwordReset: strictObject({
    title: text(),
    description: text(),
    submitLabel: text(),
    password: basicField(),
    confirmPassword: strictObject({
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
  verify: strictObject({
    loadingTitle: text(),
    successTitle: text(),
    failedTitle: text(),
    loadingDescription: text(),
    invalidDescription: text(),
    successDescription: text(),
    failedDescription: text(),
  }),
  protectedPage: message(),
  passwordPolicy: strictObject({
    minLength: pipe(number(), integer(), minValue(1)),
    maxLength: pipe(number(), integer(), minValue(1)),
    requiredMessage: text(),
    minLengthMessage: text(),
    maxLengthMessage: text(),
    lowercaseMessage: text(),
    uppercaseMessage: text(),
    numberMessage: text(),
    notSameAsCurrentMessage: text(),
    requirements: pipe(array(strictObject({
      key: requiredText(),
      pattern: requiredText(),
      label: text(),
    })), minLength(1)),
    strengthLabels: strictObject({
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
    if (import.meta.dev) {
      console.warn(
        '[auth/config] Falling back to local auth UI config because Drupal config could not be loaded.',
        error,
      )
    }

    return {}
  }
}
