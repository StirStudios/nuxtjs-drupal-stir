import {
  array,
  mixed,
  number,
  object,
  string,
  ValidationError,
} from 'yup'
import type {
  AuthIdentifierMode,
  AuthUiConfig,
} from '../../app/types/auth'
import { layerAuthDrupalApiRequest } from './drupalApi'

const text = () => string().defined()
const identifierMode = () => mixed<AuthIdentifierMode>()
  .oneOf(['email', 'username', 'email_or_username'])
  .defined()
const basicField = () => object({
  label: text(),
  placeholder: text(),
}).exact().defined()
const requiredField = () => object({
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
}).exact().defined()
const validatedField = () => object({
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
  invalidMessage: text(),
}).exact().defined()
const identifierField = () => object({
  mode: identifierMode(),
  label: text(),
  placeholder: text(),
  requiredMessage: text(),
  invalidMessage: text(),
}).exact().defined()
const message = () => object({
  title: text(),
  description: text(),
}).exact().defined()

const authUiConfigSchema = object({
  version: number().oneOf([2]).defined(),
  loginRedirectPath: string().required(),
  logoutRedirectPath: string().required(),
  identifierModes: object({
    login: identifierMode(),
    passwordRequest: identifierMode(),
  }).exact().defined(),
  login: object({
    title: text(),
    description: text(),
    submitLabel: text(),
    identifier: identifierField(),
    password: requiredField(),
    successToast: message(),
  }).exact().defined(),
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
    }).exact().defined(),
  }).exact().defined(),
  passwordRequest: object({
    title: text(),
    description: text(),
    submitLabel: text(),
    identifier: identifierField(),
    sentTitle: text(),
    sentDescription: text(),
  }).exact().defined(),
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
    }).exact().defined(),
    checkingTitle: text(),
    unavailableTitle: text(),
    invalidLinkMessage: text(),
    expiredLinkMessage: text(),
    successToast: message(),
  }).exact().defined(),
  verify: object({
    loadingTitle: text(),
    successTitle: text(),
    failedTitle: text(),
    loadingDescription: text(),
    invalidDescription: text(),
    successDescription: text(),
    failedDescription: text(),
  }).exact().defined(),
  protectedPage: message(),
  passwordPolicy: object({
    minLength: number().integer().min(1).defined(),
    maxLength: number().integer().min(1).defined(),
    requiredMessage: text(),
    minLengthMessage: text(),
    maxLengthMessage: text(),
    lowercaseMessage: text(),
    uppercaseMessage: text(),
    numberMessage: text(),
    notSameAsCurrentMessage: text(),
    requirements: array().of(object({
      key: string().required(),
      pattern: string().required(),
      label: text(),
    }).exact().defined()).min(1).defined(),
    strengthLabels: object({
      empty: text(),
      weak: text(),
      medium: text(),
      strong: text(),
      mustContain: text(),
    }).exact().defined(),
  }).exact().defined(),
}).exact().defined()

function contractError(path: string): TypeError {
  return new TypeError(`Invalid Drupal auth UI config contract at ${path}`)
}

function normalizeValidationPath(path = 'root'): string {
  return path.replaceAll(/\[(\d+)\]/g, '.$1')
}

export function parseAuthUiConfigResponse(value: unknown): AuthUiConfig {
  let config: ReturnType<typeof authUiConfigSchema['validateSync']>

  try {
    config = authUiConfigSchema.validateSync(value, {
      abortEarly: true,
      strict: true,
    })
  }
  catch (error) {
    if (error instanceof ValidationError) {
      throw contractError(normalizeValidationPath(error.path))
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
