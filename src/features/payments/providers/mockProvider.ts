import type { Payment, PaymentTransaction } from "@/types/entities";
import { PaymentStatus } from "@/types/enums";
import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentLookup,
  PaymentProvider,
  RefundPaymentInput,
  RefundPaymentResult,
} from "@/features/payments/providers/types";
import { ApiError, ErrorCode } from "@/lib/api/errors";

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * In-memory mock payment provider for local development.
 * Swap for Razorpay / Stripe adapters behind the same PaymentProvider interface.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  private readonly store: PaymentLookup;
  private readonly shouldFail: boolean;

  constructor(store?: PaymentLookup, options?: { shouldFail?: boolean }) {
    this.store = store ?? createInMemoryPaymentStore();
    this.shouldFail = options?.shouldFail ?? false;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new ApiError(
        "Payment amount must be greater than zero",
        422,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const timestamp = nowIso();
    const paymentId = createId("pay");
    const providerPaymentId = createId("mock");

    const payment: Payment = {
      id: paymentId,
      customerId: input.customerId,
      subscriptionId: input.subscriptionId,
      amount: input.amount,
      currency: input.currency ?? "INR",
      status: PaymentStatus.PENDING,
      provider: this.name,
      providerPaymentId,
      method: input.method ?? "mock_card",
      metadata: {
        ...input.metadata,
        description: input.description,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const transaction: PaymentTransaction = {
      id: createId("txn"),
      paymentId,
      type: "AUTHORIZATION",
      amount: input.amount,
      currency: payment.currency,
      status: PaymentStatus.PENDING,
      providerReference: providerPaymentId,
      rawResponse: { provider: this.name, stage: "create" },
      createdAt: timestamp,
    };

    this.store.savePayment(payment);
    this.store.saveTransaction(transaction);

    return {
      payment,
      transaction,
      clientSecret: `mock_secret_${providerPaymentId}`,
      redirectUrl: undefined,
    };
  }

  async confirmPayment(
    input: ConfirmPaymentInput,
  ): Promise<ConfirmPaymentResult> {
    const existing = this.store.getPayment(input.paymentId);
    if (!existing) {
      throw new ApiError("Payment not found", 404, ErrorCode.NOT_FOUND);
    }

    if (
      existing.status === PaymentStatus.SUCCESS ||
      existing.status === PaymentStatus.REFUNDED
    ) {
      throw new ApiError(
        `Payment already ${existing.status.toLowerCase()}`,
        409,
        ErrorCode.CONFLICT,
      );
    }

    const timestamp = nowIso();
    const status = this.shouldFail
      ? PaymentStatus.FAILED
      : PaymentStatus.SUCCESS;

    const payment: Payment = {
      ...existing,
      status,
      providerPaymentId: input.providerPaymentId ?? existing.providerPaymentId,
      failureReason: this.shouldFail ? "Mock payment declined" : undefined,
      metadata: {
        ...existing.metadata,
        ...input.metadata,
      },
      updatedAt: timestamp,
    };

    const transaction: PaymentTransaction = {
      id: createId("txn"),
      paymentId: payment.id,
      type: "CAPTURE",
      amount: payment.amount,
      currency: payment.currency,
      status,
      providerReference: payment.providerPaymentId,
      rawResponse: {
        provider: this.name,
        stage: "confirm",
        success: !this.shouldFail,
      },
      createdAt: timestamp,
    };

    this.store.savePayment(payment);
    this.store.saveTransaction(transaction);

    if (this.shouldFail) {
      throw new ApiError("Mock payment failed", 402, ErrorCode.BAD_REQUEST, {
        paymentId: payment.id,
      });
    }

    return { payment, transaction };
  }

  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const existing = this.store.getPayment(input.paymentId);
    if (!existing) {
      throw new ApiError("Payment not found", 404, ErrorCode.NOT_FOUND);
    }

    if (existing.status !== PaymentStatus.SUCCESS) {
      throw new ApiError(
        "Only successful payments can be refunded",
        409,
        ErrorCode.CONFLICT,
      );
    }

    const refundAmount = input.amount ?? existing.amount;
    if (refundAmount <= 0 || refundAmount > existing.amount) {
      throw new ApiError(
        "Invalid refund amount",
        422,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const timestamp = nowIso();
    const payment: Payment = {
      ...existing,
      status: PaymentStatus.REFUNDED,
      metadata: {
        ...existing.metadata,
        ...input.metadata,
        refundReason: input.reason,
        refundAmount,
      },
      updatedAt: timestamp,
    };

    const transaction: PaymentTransaction = {
      id: createId("txn"),
      paymentId: payment.id,
      type: "REFUND",
      amount: refundAmount,
      currency: payment.currency,
      status: PaymentStatus.REFUNDED,
      providerReference: createId("mock_refund"),
      rawResponse: {
        provider: this.name,
        stage: "refund",
        reason: input.reason,
      },
      createdAt: timestamp,
    };

    this.store.savePayment(payment);
    this.store.saveTransaction(transaction);

    return { payment, transaction };
  }
}

export function createInMemoryPaymentStore(): PaymentLookup & {
  payments: Map<string, Payment>;
  transactions: PaymentTransaction[];
} {
  const payments = new Map<string, Payment>();
  const transactions: PaymentTransaction[] = [];

  return {
    payments,
    transactions,
    getPayment(paymentId: string) {
      return payments.get(paymentId);
    },
    savePayment(payment: Payment) {
      payments.set(payment.id, payment);
    },
    saveTransaction(transaction: PaymentTransaction) {
      transactions.push(transaction);
    },
  };
}

export function createMockPaymentProvider(
  store?: PaymentLookup,
  options?: { shouldFail?: boolean },
): MockPaymentProvider {
  return new MockPaymentProvider(store, options);
}
