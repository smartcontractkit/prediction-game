import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function useSearchQueries() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams],
  )

  return { pathname, searchParams, createQueryString }
}
