export type RegistrationMode =
  | 'admin_only'
  | 'visitors'
  | 'visitors_admin_approval'

export interface RegisterPolicyProducerResponse {
  allowed: boolean
  mode: RegistrationMode
}

export interface RegisterPolicyResponse {
  allowed: boolean
  mode?: RegistrationMode
}
