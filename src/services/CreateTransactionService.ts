/* eslint-disable prefer-const */
import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    categoryTitle,
    type,
  }: RequestDTO): Promise<Transaction> {
    const categoryRepo = getRepository(Category);
    const transactionRepo = getCustomRepository(TransactionsRepository);
    const { total } = await transactionRepo.getBalance();

    const { typeValidation, validationBalance } = {
      typeValidation: type === 'income' || type === 'outcome',
      validationBalance: type === 'outcome' && value > total,
    };

    if (!typeValidation) throw new AppError('Invalid type', 401);

    if (validationBalance) {
      throw new AppError('Invalid transaction', 400);
    }

    let categoryExists = await categoryRepo.findOne({
      where: { title: categoryTitle },
    });

    if (!categoryExists) {
      categoryExists = categoryRepo.create({ title: categoryTitle });
      await categoryRepo.save(categoryExists);
    }

    const { id } = categoryExists;

    const newTransaction = transactionRepo.create({
      category_id: id,
      title,
      value,
      type,
    });
    await transactionRepo.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
