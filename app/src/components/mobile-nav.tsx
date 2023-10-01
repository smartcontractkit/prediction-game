import Image from 'next/image'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import MainNav from '@/components/main-nav'

export default function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Image src="/nav-menu.svg" width={24} height={24} alt="logo" />
      </SheetTrigger>
      <SheetContent
        size="full"
        position="left"
        className="flex flex-col max-w-[80vw] border-t-0 p-0 gap-0"
      >
        <div className="pt-[63px] border-b border-b-border md:hidden"></div>
        <MainNav />
      </SheetContent>
    </Sheet>
  )
}
