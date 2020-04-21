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
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid type', 401);
    }
    const categoryRepo = getRepository(Category);
    const transactionRepo = getCustomRepository(TransactionsRepository);

    const { total } = await transactionRepo.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError('Invalid transaction', 400);
    }

    const categoryExists = await categoryRepo.findOne({
      where: { title: categoryTitle },
    });

    if (!categoryExists) {
      const newCategory = categoryRepo.create({ title: categoryTitle });

      const { id } = await categoryRepo.save(newCategory);

      const newTransaction = transactionRepo.create({
        category_id: id,
        title,
        value,
        type,
      });
      await transactionRepo.save(newTransaction);

      return newTransaction;
    }

    const newTransaction = transactionRepo.create({
      category_id: categoryExists.id,
      title,
      value,
      type,
    });
    await transactionRepo.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
