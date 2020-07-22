import models from '../models';
import AdminTransaction from '../services/transaction.admin';
import TransactionService from '../services/transaction';
import { BANK_ID, BANK_NAME } from '../constants/bank';
import MailService from '../services/mail';
import { receiveProfitEmail } from '../assets/mail-content/receive-profit-email';
import Cron from 'cron';

const { Account, DepositAccount, DepositType, Customer } = models;

const createProfit = async (account) => {
  try {
    const rate = account.depositAccountDetail.DepositType.interest_rate;
    const balance = account.balance;
    const profit = balance * rate;

    const transaction = await TransactionService.create({
      source_bank_id: BANK_ID,
      source_bank_name: BANK_NAME,
      destination_bank_id: BANK_ID,
      destination_bank_name: BANK_NAME,
      source_account: account,
      destination_account: account,
      amount: profit,
      note: 'PIGGY BANK - New Profit',
    });

    await AdminTransaction.recharge(transaction);

    const email = receiveProfitEmail(transaction, account.balance);
    await MailService.sendMail(
      account.Customer.email,
      email.subject,
      email.content,
    );
  }
  catch (error) {
    console.log(error);
  }
};

const generateProfit = async () => {
  const despositeAccounts = await Account.findAll({
    include: [
      {
        model: DepositAccount,
        as: 'depositAccountDetail',
        required: true,
        include: [
          {
            model: DepositType,
          },
        ],
      },
      {
        model: Customer,
      },
    ],
  });

  await Promise.all(despositeAccounts.map(async account => {
    await createProfit(account);
  }));
};

const job = new Cron.CronJob('0 0 0 * * *', generateProfit);
job.start();
