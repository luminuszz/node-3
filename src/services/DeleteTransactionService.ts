import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: RequestDTO): Promise<void> {
    try {
      const customTransactionRepo = getCustomRepository(TransactionsRepository);
      await customTransactionRepo.delete(id);
    } catch {
      throw new AppError('Erro', 401);
    }
  }
}

export default DeleteTransactionService;
