import TransactionService from '../services/transaction';
import MailService from '../services/mail';
import { transactionconfirmation } from '../assets/mail-content/transaction-confirmation';
import { spendMoneyEmail, receiveMoneyEmail } from '../assets/mail-content/transaction';
import BankService from '../services/bank';
import AccountService from '../services/account';

export class UserTransactionController {
  static async create (req, res, next) {
    try {
      const {
        source_bank_id,
        destination_bank_id,
        source_account_id,
        destination_account_id,
        amount,
      } = req.body;

      const source_bank_name = (await BankService.getBankInfo(source_bank_id)).name;
      if (!source_bank_name) {
        return res.status(404).send({ message: 'Source bank not found' });
      }
      const destination_bank_name = (await BankService.getBankInfo(destination_bank_id)).name;
      if (!destination_bank_name) {
        return res.status(404).send({ message: 'Destination bank not found' });
      }
      const sourceAccount = await AccountService.getByAccountId(source_account_id);
      if (!sourceAccount) {
        return res.status(404).send({ message: `Source account id ${source_account_id} not found` });
      }
      const destinationAccount = await AccountService.getByAccountId(destination_account_id);
      if (!destinationAccount) {
        return res.status(404).send({ message: `Destination account id ${source_account_id} not found` });
      }
      const remaining_balance = sourceAccount.balance;
      if (amount > remaining_balance) {
        return res.status(400).send({ message: 'Remaining balance is not enough' });
      }

      const transaction = await TransactionService.create(req.body);
      const otp = await TransactionService.registerOTP(transaction);
      await MailService.sendMail(
        sourceAccount.Customer.email,
        'Money transfer confirmation',
        transactionconfirmation(transaction, sourceAccount, otp),
      );
      res.send({
        transaction_id: transaction.id,
      });
    }
    catch (error) {
      next(error);
    }
  }

  static async execute (req, res, next) {
    try {
      const { otp } = req.body;
      const { transaction_id } = req.params;
      const transaction = await TransactionService.one({ transaction_id: parseInt(transaction_id) });
      await TransactionService.verifyOTP(transaction, otp);
      const { sourceAccount, destinationAccount } = await TransactionService.execute(transaction);

      const spendEmail = spendMoneyEmail(transaction, sourceAccount.balance);
      await MailService.sendMail(
        sourceAccount.Customer.email,
        spendEmail.subject,
        spendEmail.content,
      );
      const receiveEmail = receiveMoneyEmail(transaction, destinationAccount.balance);
      await MailService.sendMail(
        destinationAccount.Customer.email,
        receiveEmail.subject,
        receiveEmail.content,
      );

      res.send({
        message: 'success',
      });
    }
    catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { page } = req.query;
      const { account_id } = req.params;
      const transactions = await TransactionService.all({ account_id, page });
      res.send({
        transactions,
      });
    }
    catch (error) {
      next(error);
    }
  }

  static async getOne(req, res, next) {
    try {
      const { page } = req.query;
      const { account_id } = req.params;
      const transactions = await TransactionService.all({ account_id, page });
      res.send({
        transactions,
      });
    }
    catch (error) {
      next(error);
    }
  }
}