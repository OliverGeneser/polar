'use client'

import BenefitDetails from '@/components/Benefit/BenefitDetails'
import { BenefitRow } from '@/components/Benefit/BenefitRow'
import { previewOpts } from '@/components/Feed/Markdown/BrowserRender'
import { InlineModal } from '@/components/Modal/InlineModal'
import {
  useOrganization,
  useUserBenefits,
  useUserOrderInvoice,
} from '@/hooks/queries'
import { formatCurrencyAndAmount } from '@/utils/money'
import { organizationPageLink } from '@/utils/nav'
import { ArrowBackOutlined } from '@mui/icons-material'
import { UserBenefit, UserOrder } from '@polar-sh/sdk'
import Markdown from 'markdown-to-jsx'
import Link from 'next/link'
import Button from 'polarkit/components/ui/atoms/button'
import ShadowBox from 'polarkit/components/ui/atoms/shadowbox'
import { useCallback, useState } from 'react'

const ClientPage = ({ order }: { order: UserOrder }) => {
  const { data: organization } = useOrganization(order.product.organization_id)
  const { data: benefits } = useUserBenefits({
    orderId: order.id,
    limit: 100,
    sorting: ['type'],
  })

  const [selectedBenefit, setSelectedBenefit] = useState<UserBenefit | null>(
    null,
  )

  const orderInvoiceMutation = useUserOrderInvoice()
  const openInvoice = useCallback(async () => {
    const { url } = await orderInvoiceMutation.mutateAsync(order.id)
    window.open(url, '_blank')
  }, [orderInvoiceMutation, order])

  return (
    <div className="flex flex-col gap-y-8">
      <Link
        className="flex flex-row items-center gap-2 self-start text-sm text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300"
        href={`/purchases/products`}
      >
        <ArrowBackOutlined fontSize="inherit" />
        <span>Back to Purchases</span>
      </Link>
      <div className="flex h-full flex-grow flex-row items-start gap-x-12">
        <div className="flex w-full flex-col gap-8 md:w-full">
          {benefits?.items && (
            <ShadowBox className="flex flex-col gap-6 ring-gray-100">
              {benefits.items.map((benefit) => (
                <>
                  <BenefitRow
                    key={benefit.id}
                    benefit={benefit}
                    selected={benefit.id === selectedBenefit?.id}
                    onSelect={() => setSelectedBenefit(benefit)}
                  />
                </>
              ))}
            </ShadowBox>
          )}
          <InlineModal
            isShown={selectedBenefit !== null}
            hide={() => setSelectedBenefit(null)}
            modalContent={
              <div className="px-8 py-10">
                {selectedBenefit && (
                  <BenefitDetails benefit={selectedBenefit} />
                )}
              </div>
            }
          />
        </div>
        <div className="flex w-full max-w-[340px] flex-col gap-8">
          <ShadowBox className="flex flex-col gap-8 md:ring-gray-100">
            <h3 className="text-lg font-medium">{order.product.name}</h3>
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-light text-blue-500 dark:text-blue-400">
                {formatCurrencyAndAmount(order.amount, order.currency, 0)}
              </h1>
              <p className="dark:text-polar-500 text-sm text-gray-400">
                Purchased on{' '}
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                fullWidth
                onClick={openInvoice}
                loading={orderInvoiceMutation.isPending}
                disabled={orderInvoiceMutation.isPending}
              >
                Download Invoice
              </Button>
              {organization && (
                <Link
                  href={organizationPageLink(
                    organization,
                    `products/${order.product.id}`,
                  )}
                >
                  <Button size="lg" variant="ghost" fullWidth>
                    Go to Product
                  </Button>
                </Link>
              )}
            </div>
          </ShadowBox>
          <div className="flex flex-col gap-y-4">
            {/* {'media' in order.product && order.product.media.length && (
            <Slideshow images={order.product.media} />
          )} */}
            <ShadowBox className="flex flex-col gap-6 ring-gray-100">
              <div className="prose dark:prose-invert prose-headings:mt-8 prose-headings:font-semibold prose-headings:text-black prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-md prose-h6:text-sm dark:prose-headings:text-polar-50 dark:text-polar-300 max-w-4xl text-gray-800">
                <Markdown
                  options={{
                    ...previewOpts,
                    overrides: {
                      ...previewOpts.overrides,
                      a: (props) => (
                        <a {...props} rel="noopener noreferrer nofollow" />
                      ),
                    },
                  }}
                >
                  {order.product.description ?? ''}
                </Markdown>
              </div>
            </ShadowBox>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientPage
