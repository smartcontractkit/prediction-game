import Link from 'next/link'
import Image from 'next/image'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import UserBalance from '@/components/user-balance'
import { ScrollArea } from './ui/scroll-area'

export default function MainNav() {
  return (
    <ScrollArea className="h-[100dvh]">
      <div className="flex h-[calc(100dvh-104px)] flex-1 flex-col justify-between px-4 pb-4 md:h-[calc(100vh-32px)] md:px-0 md:pb-0">
        <div className="border-b border-b-border pb-6">
          <Link href="/">
            <Image
              src="/logo.svg"
              width={155}
              height={48}
              alt="logo"
              className="mx-auto mt-1 hidden md:block"
            />
          </Link>
          <div className="flex space-x-[16px] border-b border-b-border py-6">
            <Image src="/player.png" width={60} height={60} alt="player" />
            <UserBalance />
          </div>
          <Accordion type="single" defaultValue="disclaimer">
            <AccordionItem value="disclaimer">
              <AccordionTrigger>
                <div className="flex items-center space-x-[6px] text-base font-bold leading-4">
                  <Image src="/info.svg" width={16} height={16} alt="info" />
                  <span>Disclaimer</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-secondary-foreground">
                  This dApp has been developed for educational purposes only and
                  is not meant to be used for gambling
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion type="single" defaultValue="for-devs">
            <AccordionItem value="for-devs">
              <AccordionTrigger>
                <div className="flex items-center space-x-[6px] text-base font-bold leading-4">
                  <Image src="/code.svg" width={16} height={16} alt="code" />
                  <span>For Developers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-secondary-foreground">
                  Built on top of Optimism Sepolia testnet and Chainlink, this dApp
                  enables users to interact with real time sport data, receive
                  automatic payouts, and transfer tokens across chains.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <a
            href="https://faucets.chain.link/optimism-sepolia"
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center space-x-[8px] text-base font-bold leading-4 hover:underline hover:brightness-125"
          >
            <Image src="/optimism.svg" width={16} height={16} alt="optimism" />
            <span>Get testnet ETH</span>
            <Image
              src="/external-link.svg"
              width={12}
              height={12}
              alt="external"
            />
          </a>
          <a
            href="https://github.com/smartcontractkit/prediction-game"
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center space-x-[8px] text-base font-bold leading-4 hover:underline hover:brightness-125"
          >
            <Image src="/github.svg" width={16} height={16} alt="github" />
            <span>Go To Repository</span>
            <Image
              src="/external-link.svg"
              width={12}
              height={12}
              alt="external"
            />
          </a>
        </div>
        <div className="flex flex-col space-y-2">
          <p className="mb-2 font-bold leading-4 text-secondary-foreground">
            Demo Powered By:
          </p>
          <a
            href="https://chain.link/functions"
            target="_blank"
            rel="noreferrer"
            className="relative flex items-center space-x-3 overflow-hidden rounded-[8px] bg-card px-4 py-1 hover:brightness-125"
          >
            <Image
              src="/functions.svg"
              height={30}
              width={30}
              alt="functions"
            />
            <span className="text-[12px] font-[450] leading-3 tracking-[3.75px]">
              FUNCTIONS
            </span>
            <Image
              src="/functions.svg"
              height={60}
              width={60}
              className="absolute -right-2 top-2 opacity-10"
              alt="functions"
            />
          </a>
          <a
            href="https://chain.link/cross-chain"
            target="_blank"
            rel="noreferrer"
            className="relative flex items-center space-x-3 overflow-hidden rounded-[8px] bg-card px-4 py-1 hover:brightness-125"
          >
            <Image src="/ccip.svg" height={30} width={30} alt="ccip" />
            <span className="text-[12px] font-[450] leading-3 tracking-[3.75px]">
              CCIP
            </span>
            <Image
              src="/ccip.svg"
              height={60}
              width={60}
              className="absolute -right-2 top-2 opacity-10"
              alt="ccip"
            />
          </a>
          <a
            href="https://chain.link/automation"
            target="_blank"
            rel="noreferrer"
            className="relative flex items-center space-x-3 overflow-hidden rounded-[8px] bg-card px-4 py-1 hover:brightness-125"
          >
            <Image
              src="/automation.svg"
              height={30}
              width={30}
              alt="automation"
            />
            <span className="text-[12px] font-[450] leading-3 tracking-[3.75px]">
              AUTOMATION
            </span>
            <Image
              src="/automation.svg"
              height={60}
              width={60}
              className="absolute -right-2 top-2 opacity-10"
              alt="automation"
            />
          </a>
        </div>
      </div>
    </ScrollArea>
  )
}
