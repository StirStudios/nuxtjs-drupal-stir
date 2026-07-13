export function useNavLock() {
  const locked = useState<boolean>('nav-locked', () => false)

  return { locked }
}
