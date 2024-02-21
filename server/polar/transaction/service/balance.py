import uuid

import structlog

from polar.account.service import account as account_service
from polar.integrations.stripe.service import stripe as stripe_service
from polar.integrations.stripe.utils import get_expandable_id
from polar.kit.utils import generate_uuid
from polar.logging import Logger
from polar.models import Account, IssueReward, Pledge, Subscription, Transaction
from polar.models.transaction import TransactionType
from polar.postgres import AsyncSession

from .base import BaseTransactionService, BaseTransactionServiceError

log: Logger = structlog.get_logger()


class BalanceTransactionError(BaseTransactionServiceError):
    ...


class PaymentTransactionForChargeDoesNotExist(BalanceTransactionError):
    def __init__(self, charge_id: str) -> None:
        self.charge_id = charge_id
        message = f"No payment transaction exist for charge {charge_id}."
        super().__init__(message)


class BalanceTransactionService(BaseTransactionService):
    async def create_balance(
        self,
        session: AsyncSession,
        *,
        destination_account: Account,
        payment_transaction: Transaction,
        amount: int,
        pledge: Pledge | None = None,
        subscription: Subscription | None = None,
        issue_reward: IssueReward | None = None,
    ) -> tuple[Transaction, Transaction]:
        source_currency = payment_transaction.currency.lower()

        balance_correlation_key = str(uuid.uuid4())

        outgoing_transaction = Transaction(
            id=generate_uuid(),
            account=None,  # Polar account
            type=TransactionType.balance,
            currency=source_currency,
            amount=-amount,  # Subtract the amount
            account_currency=source_currency,
            account_amount=-amount,
            tax_amount=0,
            balance_correlation_key=balance_correlation_key,
            pledge=pledge,
            issue_reward=issue_reward,
            subscription=subscription,
            payment_transaction=payment_transaction,
        )
        incoming_transaction = Transaction(
            id=generate_uuid(),
            account=destination_account,  # User account
            type=TransactionType.balance,
            currency=source_currency,
            amount=amount,  # Add the amount
            account_currency=source_currency,
            account_amount=amount,
            tax_amount=0,
            balance_correlation_key=balance_correlation_key,
            pledge=pledge,
            issue_reward=issue_reward,
            subscription=subscription,
            payment_transaction=payment_transaction,
        )

        session.add(outgoing_transaction)
        session.add(incoming_transaction)
        await session.commit()

        await account_service.check_review_threshold(session, destination_account)

        return (outgoing_transaction, incoming_transaction)

    async def create_balance_from_charge(
        self,
        session: AsyncSession,
        *,
        destination_account: Account,
        charge_id: str,
        amount: int,
        pledge: Pledge | None = None,
        subscription: Subscription | None = None,
        issue_reward: IssueReward | None = None,
    ) -> tuple[Transaction, Transaction]:
        payment_transaction = await self.get_by(
            session, type=TransactionType.payment, charge_id=charge_id
        )
        if payment_transaction is None:
            raise PaymentTransactionForChargeDoesNotExist(charge_id)

        return await self.create_balance(
            session,
            destination_account=destination_account,
            payment_transaction=payment_transaction,
            amount=amount,
            pledge=pledge,
            subscription=subscription,
            issue_reward=issue_reward,
        )

    async def create_balance_from_payment_intent(
        self,
        session: AsyncSession,
        *,
        destination_account: Account,
        payment_intent_id: str,
        amount: int,
        pledge: Pledge | None = None,
        subscription: Subscription | None = None,
        issue_reward: IssueReward | None = None,
    ) -> tuple[Transaction, Transaction]:
        payment_intent = stripe_service.retrieve_intent(payment_intent_id)
        assert payment_intent.latest_charge is not None
        charge_id = get_expandable_id(payment_intent.latest_charge)

        return await self.create_balance_from_charge(
            session,
            destination_account=destination_account,
            charge_id=charge_id,
            amount=amount,
            pledge=pledge,
            subscription=subscription,
            issue_reward=issue_reward,
        )

    async def create_reversal_balance(
        self,
        session: AsyncSession,
        *,
        balance_transactions: tuple[Transaction, Transaction],
        destination_currency: str,
        amount: int,
    ) -> tuple[Transaction, Transaction]:
        outgoing, incoming = balance_transactions
        source_account_id = incoming.account_id
        assert source_account_id is not None
        source_account = await account_service.get(session, source_account_id)
        assert source_account is not None

        source_currency = source_account.currency

        balance_correlation_key = str(uuid.uuid4())

        outgoing_reversal = Transaction(
            id=generate_uuid(),
            account=source_account,  # User account
            type=TransactionType.balance,
            currency=destination_currency,
            amount=-amount,  # Subtract the amount
            account_currency=source_currency,
            account_amount=-amount,
            tax_amount=0,
            balance_correlation_key=balance_correlation_key,
            pledge_id=outgoing.pledge_id,
            issue_reward_id=outgoing.issue_reward_id,
            subscription_id=outgoing.subscription_id,
            balance_reversal_transaction=incoming,
        )
        incoming_reversal = Transaction(
            id=generate_uuid(),
            account=None,  # Polar account
            type=TransactionType.balance,
            currency=destination_currency,
            amount=amount,  # Add the amount
            account_currency=destination_currency,
            account_amount=amount,
            tax_amount=0,
            balance_correlation_key=balance_correlation_key,
            pledge_id=outgoing.pledge_id,
            issue_reward_id=outgoing.issue_reward_id,
            subscription_id=outgoing.subscription_id,
            balance_reversal_transaction=outgoing,
        )

        session.add(outgoing_reversal)
        session.add(incoming_reversal)
        await session.commit()

        return (outgoing_reversal, incoming_reversal)


balance_transaction = BalanceTransactionService(Transaction)
