'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'

export default function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const searchDebounced = useDebounce(searchInput)

  useEffect(() => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))

    if (!searchDebounced) {
      current.delete('search')
    } else {
      current.set('search', searchDebounced)
    }
    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`${pathname}${query}`)
  }, [searchDebounced, pathname, searchParams, router])

  return (
    <div className="relative px-4 py-3">
      <div className="flex w-[217px] items-center justify-between space-x-2 rounded-md bg-input px-3 py-2 hover:brightness-125">
        <Image src="/search.svg" width={16} height={16} alt="search" />

        <Input
          className="h-auto rounded-none border-0 p-0 text-base font-[450] leading-4 text-secondary-foreground [appearance:textfield] placeholder:text-secondary-foreground focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="Search..."
          onChange={(e) => setSearchInput(e.target.value.trim())}
        />
      </div>
    </div>
  )
}
