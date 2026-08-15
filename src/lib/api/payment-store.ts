import type { Payment, PaymentTransaction } from "@/types/entities";
import type { PaymentLookup } from "@/features/payments/providers/types";
import { getDb, mutate } from "@/mocks/seed";
import { createMockPaymentProvider } from "@/features/payments/providers/mockProvider";

export function createSeedPaymentLookup(): PaymentLookup {
  return {
    getPayment(paymentId: string) {
      return getDb().payments.find((payment) => payment.id === paymentId);
    },
    savePayment(payment: Payment) {
      mutate((db) => {
        const index = db.payments.findIndex((item) => item.id === payment.id);
        if (index >= 0) {
          db.payments[index] = payment;
        } else {
          db.payments.push(payment);
        }
      });
    },
    saveTransaction(transaction: PaymentTransaction) {
      mutate((db) => {
        db.paymentTransactions.push(transaction);
      });
    },
  };
}

export function getMockPaymentProvider() {
  return createMockPaymentProvider(createSeedPaymentLookup());
}
