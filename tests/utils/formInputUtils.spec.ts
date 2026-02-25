import { describe, expect, it } from 'vitest'
import {
  clampNumberToBounds,
  isTelCharacterAllowed,
  normalizeNumberBounds,
  sanitizeTelValue,
  shouldPreventTelBeforeInput,
  shouldPreventTelKeydown,
} from '../../app/utils/formInputUtils'

describe('formInputUtils', () => {
  describe('sanitizeTelValue', () => {
    it('removes letters and unsupported symbols', () => {
      expect(sanitizeTelValue('abc(555) 123-4567 ext#9')).toBe('(555) 123-4567 9')
    })

    it('keeps a single leading plus and strips extra plus symbols', () => {
      expect(sanitizeTelValue('++1+ (555) 123-4567')).toBe('+1 (555) 123-4567')
      expect(sanitizeTelValue('1+555+123')).toBe('1555123')
    })
  })

  describe('isTelCharacterAllowed', () => {
    it('allows numeric phone characters and blocks letters', () => {
      expect(isTelCharacterAllowed('+')).toBe(true)
      expect(isTelCharacterAllowed('5')).toBe(true)
      expect(isTelCharacterAllowed('(')).toBe(true)
      expect(isTelCharacterAllowed('a')).toBe(false)
      expect(isTelCharacterAllowed('@')).toBe(false)
    })
  })

  describe('shouldPreventTelBeforeInput', () => {
    it('blocks invalid beforeinput data and allows valid data', () => {
      expect(shouldPreventTelBeforeInput('a')).toBe(true)
      expect(shouldPreventTelBeforeInput('@')).toBe(true)
      expect(shouldPreventTelBeforeInput('5')).toBe(false)
      expect(shouldPreventTelBeforeInput('+')).toBe(false)
      expect(shouldPreventTelBeforeInput(undefined)).toBe(false)
      expect(shouldPreventTelBeforeInput(null)).toBe(false)
    })
  })

  describe('shouldPreventTelKeydown', () => {
    it('blocks invalid single-key input and allows valid keys', () => {
      expect(shouldPreventTelKeydown('a')).toBe(true)
      expect(shouldPreventTelKeydown('@')).toBe(true)
      expect(shouldPreventTelKeydown('9')).toBe(false)
      expect(shouldPreventTelKeydown('(')).toBe(false)
      expect(shouldPreventTelKeydown('Backspace')).toBe(false)
    })

    it('allows modified key combos for shortcuts', () => {
      expect(shouldPreventTelKeydown('a', { metaKey: true })).toBe(false)
      expect(shouldPreventTelKeydown('a', { ctrlKey: true })).toBe(false)
      expect(shouldPreventTelKeydown('a', { altKey: true })).toBe(false)
    })
  })

  describe('normalizeNumberBounds', () => {
    it('normalizes min/max using minimum allowed fallback', () => {
      expect(normalizeNumberBounds(undefined, undefined, 1)).toEqual({ min: 1, max: undefined })
      expect(normalizeNumberBounds(-10, 0, 1)).toEqual({ min: 1, max: 1 })
      expect(normalizeNumberBounds(5, 3, 1)).toEqual({ min: 5, max: 5 })
      expect(normalizeNumberBounds(2, 8, 1)).toEqual({ min: 2, max: 8 })
    })
  })

  describe('clampNumberToBounds', () => {
    it('clamps values within normalized bounds', () => {
      expect(clampNumberToBounds(0, { min: 1 })).toBe(1)
      expect(clampNumberToBounds(4, { min: 1, max: 3 })).toBe(3)
      expect(clampNumberToBounds(2, { min: 1, max: 3 })).toBe(2)
    })
  })
})
