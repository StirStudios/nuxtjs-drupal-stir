export type WebformSubmissionError = {
  error: {
    message: string
    details: Record<string, unknown> | unknown[]
    flat: string[]
  } & Record<string, unknown>
} & Record<string, unknown>

export type WebformSubmissionSuccess = {
  sid: string
  confirmation_type?: string | null
  confirmation_url?: string | null
  confirmation_message?: string | null
  confirmation_title?: string | null
  confirmation_attributes?: Record<string, unknown> | unknown[] | null
  confirmation_back?: boolean | null
  confirmation_back_label?: string | null
  confirmation_back_attributes?: Record<string, unknown> | unknown[] | null
} & Record<string, unknown>

export type WebformSubmissionResponse =
  | WebformSubmissionSuccess
  | WebformSubmissionError
