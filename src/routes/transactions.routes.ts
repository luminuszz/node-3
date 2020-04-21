import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository } from 'typeorm';
import uploadConfig from '../config/uploadConfig';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsCustomRepo = getCustomRepository(TransactionsRepository);

  try {
    const transactions = await transactionsCustomRepo.find();

    const balance = await transactionsCustomRepo.getBalance();

    return response.json({ transactions, balance });
  } catch (err) {
    return response.status(400).json({ message: err });
  }
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;
  const createTransaction = new CreateTransactionService();
  const trasaction = await createTransaction.execute({
    value,
    title,
    type,
    categoryTitle: category,
  });

  return response.json(trasaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute({ id });
  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const filePath = request.file.path;
    const uploadCsv = new ImportTransactionsService();

    const csv = await uploadCsv.execute({ filePath });

    return response.json(csv);
  },
);

export default transactionsRouter;
