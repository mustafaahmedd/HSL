export const DEFAULT_PAYMENT_ACCOUNT = {
  bankName: process.env.NEXT_PUBLIC_DEFAULT_BANK_NAME || 'SadaPay',
  accountTitle: process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_TITLE || 'Mustafa Ahmed',
  accountNumber: process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_NUMBER || '03142566165',
  iban: process.env.NEXT_PUBLIC_DEFAULT_IBAN || 'PK48SADA0000003142566165',
};
