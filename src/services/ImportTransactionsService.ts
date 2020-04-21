/* eslint-disable consistent-return */
import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  filePath: string;
}
interface CSVTramsaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ filePath }: RequestDTO): Promise<Transaction[]> {
    const transactionRepo = getRepository(Transaction);
    const categoryRepo = getRepository(Category);

    const transactions: CSVTramsaction[] = [];
    const categories: string[] = [];
    const contactRead = fs.createReadStream(filePath);
    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contactRead.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existsCategoris = await categoryRepo.find({
      where: {
        title: In(categories),
      },
    });
    const existenCategoryTitle = existsCategoris.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existenCategoryTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategory = categoryRepo.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );
    await categoryRepo.save(newCategory);

    const finalCategories = [...newCategory, ...existsCategoris];

    const newTransaction = transactionRepo.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionRepo.save(newTransaction);
    await fs.promises.unlink(filePath);

    return newTransaction;
  }
}

export default ImportTransactionsService;

/**
 *



 */
