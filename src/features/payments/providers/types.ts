import type { Payment, PaymentTransaction } from "@/types/entities";
import type { PaymentStatus } from "@/types/enums";

export interface CreatePaymentInput {
  customerId: string;
  amount: number;
  currency?: string;
  subscriptionId?: string;
  method?: string;
  metadata?: Record<string, unknown>;
  description?: string;
}

export interface CreatePaymentResult {
  payment: Payment;
  transaction: PaymentTransaction;
  /** Client-facing redirect / client secret for real providers */
  clientSecret?: string;
  redirectUrl?: string;
}

export interface ConfirmPaymentInput {
  paymentId: string;
  providerPaymentId?: string;
  metadata?: Record<string, unknown>;
}

export interface ConfirmPaymentResult {
  payment: Payment;
  transaction: PaymentTransaction;
}

export interface RefundPaymentInput {
  paymentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundPaymentResult {
  payment: Payment;
  transaction: PaymentTransaction;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  confirmPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult>;
  refund(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}

export type PaymentProviderFactory = () => PaymentProvider;

export interface PaymentLookup {
  getPayment(paymentId: string): Payment | undefined;
  savePayment(payment: Payment): void;
  saveTransaction(transaction: PaymentTransaction): void;
}

export type { PaymentStatus };
