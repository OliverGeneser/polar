import CheckIcon from '@/components/Icons/CheckIcon'
import DollarSignIcon from '@/components/Icons/DollarSignIcon'
import EyeIcon from '@/components/Icons/EyeIcon'
import Icon from '@/components/Icons/Icon'
import { githubIssueLink } from '@/utils/github'
import { dateOrString } from '@/utils/time'
import { schemas } from '@polar-sh/client'
import Avatar from '@polar-sh/ui/components/atoms/Avatar'
import {
  formatCurrencyAndAmount,
  getCentsInDollarString,
} from '@polar-sh/ui/lib/money'

export type Column = 'PAID_OUT_DATE' | 'RECEIVER' | 'BACKER' | 'PAYMENT_STATUS'

const List = (props: {
  rewards: schemas['Reward'][]
  columns: Column[]
  title: string
  subtitle: string
}) => {
  const { rewards, columns, title, subtitle } = props

  const icon = (reward: schemas['Reward']) => {
    if (reward.state === 'pending') {
      return <Icon classes="bg-gray-200 text-gray-600" icon={<EyeIcon />} />
    }
    if (reward.state === 'paid') {
      return <Icon classes="bg-green-200 text-green-600" icon={<CheckIcon />} />
    }
    return (
      <Icon classes="bg-blue-200 text-blue-500" icon={<DollarSignIcon />} />
    )
  }

  const showPaymentStatus = columns.some((c) => c === 'PAYMENT_STATUS')

  const showPaidOutDate = columns.some((c) => c === 'PAID_OUT_DATE')

  const showReceiver = columns.some((c) => c === 'RECEIVER')

  const showBacker = columns.some((c) => c === 'BACKER')

  return (
    <div>
      <h2 className="dark:text-polar-200 px-2 font-medium text-gray-900">
        {title}
      </h2>
      <table className="w-full text-left">
        <thead className="dark:text-polar-400 text-gray-900">
          <tr>
            <th
              scope="col"
              className="relative isolate whitespace-nowrap px-2 py-3.5 text-left text-sm font-medium"
            >
              {subtitle}
            </th>

            {showReceiver && (
              <th
                scope="col"
                className="relative isolate whitespace-nowrap py-3.5 pr-2 text-left text-sm font-semibold"
              >
                Receiver
              </th>
            )}

            {showBacker && (
              <th
                scope="col"
                className="relative isolate whitespace-nowrap py-3.5 pr-2 text-left text-sm font-semibold"
              >
                Backer
              </th>
            )}

            <th
              scope="col"
              className="relative isolate hidden whitespace-nowrap py-3.5 pr-2 text-left text-sm font-medium md:table-cell"
            >
              Pledge Date
            </th>

            {showPaymentStatus && (
              <th
                scope="col"
                className="relative isolate whitespace-nowrap py-3.5 pr-2 text-left text-sm font-medium"
              >
                Status
              </th>
            )}

            {showPaidOutDate && (
              <th
                scope="col"
                className="relative isolate whitespace-nowrap py-3.5 pr-2 text-left text-sm font-medium"
              >
                Paid out date
              </th>
            )}

            <th
              scope="col"
              className="relative isolate whitespace-nowrap py-3.5 pr-2 text-right text-sm font-semibold"
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="dark:border-polar-700 dark:divide-polar-700 divide-y divide-gray-200 border-t border-gray-200">
          {rewards &&
            rewards.map((t) => (
              <tr key={t.pledge.id}>
                <td className="dark:text-polar-400 px-2 py-3 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {icon(t)}
                    <span className="inline-flex flex-col">
                      <a
                        href={githubIssueLink(t.pledge.issue)}
                        className="text-blue-500 dark:text-blue-400"
                      >
                        {t.pledge.issue.repository.organization.name}/
                        {t.pledge.issue.repository.name}#{t.pledge.issue.number}
                      </a>
                      {t.pledge.issue.title}
                    </span>
                  </div>
                </td>

                {showReceiver && (
                  <td className="dark:text-polar-400 whitespace-nowrap py-3 pr-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      {t.user && (
                        <Avatar
                          avatar_url={t.user.avatar_url}
                          name={t.user.public_name}
                          className="h-6 w-6 rounded-full"
                        />
                      )}
                      @{t.user?.public_name || 'Unknown'}
                    </div>
                  </td>
                )}

                {showBacker && (
                  <td className="dark:text-polar-400 whitespace-nowrap py-3 pr-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      {t.pledge.pledger && (
                        <Avatar
                          avatar_url={t.pledge.pledger.avatar_url}
                          name={t.pledge.pledger.name}
                          className="h-6 w-6 rounded-full"
                        />
                      )}

                      {t.pledge.pledger?.github_username ? (
                        <a
                          href={`https://github.com/${t.pledge.pledger?.github_username}`}
                          className="text-blue-500"
                        >
                          @{t.pledge.pledger?.name || 'Unknown'}
                        </a>
                      ) : (
                        <span>{t.pledge.pledger?.name || 'Unknown'}</span>
                      )}
                    </div>
                  </td>
                )}

                <td className="dark:text-polar-400 hidden whitespace-nowrap py-3 pr-3 text-sm text-gray-500 md:table-cell">
                  {formatDate(dateOrString(t.pledge.created_at))}
                </td>

                {showPaymentStatus && (
                  <td className="dark:text-polar-400 whitespace-nowrap py-3 pr-3 text-sm text-gray-500">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.pledge.type === 'pay_on_completion' &&
                        t.pledge.state === 'created' && (
                          <div className="w-fit whitespace-nowrap rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                            Pending payment from pledger
                          </div>
                        )}

                      {t.pledge.state === 'pending' && (
                        <div className="w-fit whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-800 dark:text-green-200">
                          Paid to Polar
                        </div>
                      )}
                    </div>
                  </td>
                )}

                {showPaidOutDate && (
                  <td className="dark:text-polar-400 whitespace-nowrap py-3 pr-3 text-sm text-gray-500">
                    {(t.paid_at && formatDate(dateOrString(t.paid_at))) ||
                      'Unknown'}
                  </td>
                )}

                <td className="dark:text-polar-400 whitespace-nowrap py-3 pr-3 text-right text-sm text-gray-500">
                  ${getCentsInDollarString(t.amount.amount, true, true)}
                  <br />
                  <span className="dark:text-polar-300 text-gray-400">
                    (of $
                    {formatCurrencyAndAmount(
                      t.pledge.amount,
                      t.pledge.currency,
                    )}
                    )
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default List

const formatDate = (d: Date): string => {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
