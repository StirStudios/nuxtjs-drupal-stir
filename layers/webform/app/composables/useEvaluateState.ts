import type { WebformState } from '#stir/types'
import { evaluateCondition } from '#stir-webform/utils/evaluateUtils'

interface VisibilityCondition {
  [selector: string]: { value: string }
}

interface States {
  visible?: (VisibilityCondition | 'or')[] | VisibilityCondition
  disabled?: (VisibilityCondition | 'or')[] | VisibilityCondition
  checked?: (VisibilityCondition | 'or')[] | VisibilityCondition
}

/**
 * Evaluates `#states` visibility, disabled, and checked flags for a field.
 */
export function useEvaluateState(states: States, state: WebformState) {
  const visible = computed(() => evaluateCondition(states.visible, state, true))
  const disabled = computed(() =>
    evaluateCondition(states.disabled, state, false),
  )
  const checked = computed(() =>
    evaluateCondition(states.checked, state, false),
  )

  return {
    visible,
    disabled,
    checked,
  }
}
