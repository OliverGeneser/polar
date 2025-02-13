'use client'

import { ModalBox, Modal as ModernModal } from '@/components/Modal'
import { useToastLatestPledged } from '@/hooks/stripe'
import { api } from '@/utils/client'
import { schemas } from '@polar-sh/client'
import Button from '@polar-sh/ui/components/atoms/Button'
import TextArea from '@polar-sh/ui/components/atoms/TextArea'
import { formatCurrencyAndAmount } from '@polar-sh/ui/lib/money'
import { ChangeEvent, useState } from 'react'
import SplitRewardModal from '../Finance/SplitRewardModal'
import { useModal } from '../Modal/useModal'
import IssueActivityBox from './IssueActivityBox'
import { AddBadgeButton } from './IssuePromotionModal'
import IssueSummary from './IssueSummary'
import IssueListItemDecoration from './ListItemDecoration'

const IssueListItem = (props: {
  issue: schemas['Issue']
  pledges: Array<schemas['Pledge']>
  pledgesSummary: schemas['PledgesTypeSummaries'] | null
  checkJustPledged?: boolean
  canAddRemovePolarLabel: boolean
  showPledgeAction: boolean
  right?: React.ReactElement
  className?: string
  showLogo?: boolean
  showIssueOpenClosedStatus?: boolean
  rewards: schemas['Reward'][] | null
}) => {
  const externalOrganization = props.issue.repository.organization
  const repo = props.issue.repository
  const organization = repo.internal_organization

  const mergedPledges = props.pledges || []
  const latestPledge = useToastLatestPledged(
    externalOrganization.id,
    repo.id,
    props.issue.id,
    props.checkJustPledged,
  )
  const containsLatestPledge =
    mergedPledges.find((pledge) => pledge.id === latestPledge?.id) !== undefined

  if (!containsLatestPledge && latestPledge) {
    mergedPledges.push(latestPledge)
  }

  const havePledge = mergedPledges.length > 0

  const [showDisputeModalForPledge, setShowDisputeModalForPledge] = useState<
    schemas['Pledge'] | undefined
  >()

  const onDispute = (pledge: schemas['Pledge']) => {
    setShowDisputeModalForPledge(pledge)
  }

  const onDisputeModalClose = () => {
    setShowDisputeModalForPledge(undefined)
  }

  const {
    isShown: isSplitRewardsModalShown,
    hide: closeSplitRewardModal,
    show: showSplitRewardModal,
  } = useModal()

  const onConfirmPledge = () => {
    showSplitRewardModal()
  }

  return (
    <>
      <div>
        <IssueSummary
          issue={props.issue}
          showLogo={props.showLogo}
          showStatus={props.showIssueOpenClosedStatus}
          right={
            <>
              {props.canAddRemovePolarLabel && (
                <AddBadgeButton issue={props.issue} />
              )}
              {props.right}
            </>
          }
          linkToFunding={!props.canAddRemovePolarLabel}
        />
        {havePledge && organization && (
          <IssueActivityBox>
            <IssueListItemDecoration
              issue={props.issue}
              organization={organization}
              pledges={mergedPledges}
              pledgesSummary={props.pledgesSummary}
              showDisputeAction={true}
              onDispute={onDispute}
              showConfirmPledgeAction={true}
              onConfirmPledges={onConfirmPledge}
              confirmPledgeIsLoading={false}
              funding={props.issue.funding}
              rewards={props.rewards}
            />
          </IssueActivityBox>
        )}
      </div>

      <ModernModal
        isShown={showDisputeModalForPledge !== undefined}
        hide={onDisputeModalClose}
        modalContent={
          <>
            {showDisputeModalForPledge && (
              <DisputeModal pledge={showDisputeModalForPledge} />
            )}
          </>
        }
      />

      <ModernModal
        isShown={isSplitRewardsModalShown}
        hide={closeSplitRewardModal}
        modalContent={
          <>
            <SplitRewardModal
              issueId={props.issue.id}
              onClose={closeSplitRewardModal}
            />
          </>
        }
      />
    </>
  )
}

export default IssueListItem

const DisputeModal = (props: { pledge: schemas['Pledge'] }) => {
  const [reason, setReason] = useState('')
  const [canSubmit, setCanSubmit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [didSubmit, setDidSubmit] = useState(false)

  const submit = async () => {
    setIsLoading(true)
    setMessage('')

    const { error } = await api.POST('/v1/pledges/{pledge_id}/dispute', {
      params: { path: { pledge_id: pledge.id }, query: { reason } },
    })

    setIsLoading(false)

    if (error) {
      setMessage('Something went wrong. Please try again.')
      return
    }

    setMessage("Thanks, we'll review your dispute soon.")
    setDidSubmit(true)
  }

  const onUpdateReason = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value)
    setCanSubmit(e.target.value.length > 4 && !didSubmit)
  }

  const { pledge } = props
  return (
    <ModalBox>
      <>
        <h1 className="text-2xl font-normal">Dispute your pledge</h1>
        <p className="text-sm text-gray-500">
          Still an issue or not solved in a satisfactory way?
          <br />
          <br />
          Submit a dispute and the money will be on hold until Polar has
          manually reviewed the issue and resolved the dispute.
        </p>

        <table className="min-w-full divide-y divide-gray-200">
          <tr>
            <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
              Amount
            </td>
            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">
              {formatCurrencyAndAmount(pledge.amount, pledge.currency)}
            </td>
          </tr>
          <tr>
            <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
              Pledger
            </td>
            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">
              {pledge.pledger?.name}
            </td>
          </tr>
          <tr>
            <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
              Pledge ID
            </td>
            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">
              {pledge.id}
            </td>
          </tr>
          <tr>
            <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
              Issue ID
            </td>
            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">
              {pledge.issue.id}
            </td>
          </tr>
        </table>

        {!didSubmit && (
          <>
            <label
              htmlFor="dispute_description"
              className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
            >
              Description
            </label>
            <TextArea
              id="dispute_description"
              placeholder="Explain what happened"
              rows={8}
              onChange={onUpdateReason}
            ></TextArea>
          </>
        )}

        <Button disabled={!canSubmit} onClick={submit} loading={isLoading}>
          Submit
        </Button>

        {message && <p>{message}</p>}
      </>
    </ModalBox>
  )
}
