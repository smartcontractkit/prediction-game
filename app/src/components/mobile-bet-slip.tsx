import Image from 'next/image'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import BetSlip from '@/components/bet-slip'

export default function MobileBetSlip() {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Image src="/bet-slip-icon.svg" width={24} height={24} alt="nav-menu" />
      </SheetTrigger>
      <SheetContent
        size="full"
        position="right"
        className="flex w-screen flex-col border-r border-r-border p-0"
      >
        <div className="flex h-16 items-center justify-center border-b border-b-border p-4">
          <Image
            src="/logo.svg"
            width={105}
            height={32}
            alt="logo"
            className="ml-6"
          />
        </div>
        <BetSlip />
      </SheetContent>
    </Sheet>
  )
}
