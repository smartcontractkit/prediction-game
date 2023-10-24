import 'server-only'
// @ts-ignore
import { cache } from 'react'

const serverContext = <T>(defaultValue: T): [() => T, (v: T) => void] => {
  const getRef = cache(() => ({ current: defaultValue }))

  const getValue = (): T => getRef().current

  const setValue = (value: T) => {
    getRef().current = value
  }

  return [getValue, setValue]
}

export const [getLeaguesIds, setLeaguesIds] = serverContext<number[]>([])
