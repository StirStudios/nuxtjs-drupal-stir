import {
  array,
  getDotPath,
  isValiError,
  lazy,
  maxLength,
  minLength,
  optional,
  parse,
  pipe,
  record,
  strictObject,
  string,
  transform,
  union,
  unknown,
} from 'valibot'
import type { GenericSchema } from 'valibot'
import type {
  ComponentTreeContent,
  ComponentTreeNode,
} from '../../shared/types/componentTree'

const emptyArrayAsRecord = () => pipe(
  array(unknown()),
  maxLength(0),
  transform((): Record<string, never> => ({})),
)

const propsSchema = union([
  record(string(), unknown()),
  emptyArrayAsRecord(),
])

const componentContentSchema: GenericSchema<unknown, ComponentTreeContent> = lazy(() => union([
  string(),
  array(componentContentSchema),
  componentNodeSchema,
]))

const slotsSchema = union([
  record(string(), componentContentSchema),
  emptyArrayAsRecord(),
])

const componentNodeSchema: GenericSchema<unknown, ComponentTreeNode> = strictObject({
  element: pipe(string(), minLength(1)),
  props: optional(propsSchema, {}),
  slots: optional(slotsSchema, {}),
})

function contractError(error: unknown): TypeError {
  if (isValiError(error)) {
    return new TypeError(
      `Invalid Drupal component tree contract at ${getDotPath(error.issues[0]) ?? 'root'}`,
    )
  }

  return new TypeError('Invalid Drupal component tree contract at root')
}

export function parseComponentTreeContent(value: unknown): ComponentTreeContent {
  try {
    return parse(componentContentSchema, value)
  }
  catch (error) {
    throw contractError(error)
  }
}

export function parseComponentTreeNode(value: unknown): ComponentTreeNode {
  try {
    return parse(componentNodeSchema, value)
  }
  catch (error) {
    throw contractError(error)
  }
}
