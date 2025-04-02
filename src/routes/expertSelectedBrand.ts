import express, { Request, Response, NextFunction } from 'express';
import ExpertSelectedBrand from '@/middleware/models/expertSelectedBrand';
import { CustomError } from '@/types/customError';

const router = express.Router();

// Löytöreitti
router.get('/all', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await ExpertSelectedBrand.find();
    res.status(200).json(brands);
  } catch (error) {
    next(new CustomError("Error retrieving brands", 500));
  }
});

// Lisäysreitti
router.post('/add', async (req: Request, res: Response, next: NextFunction) => {
  const { brand, model } = req.body;

  try {
    const newBrand = new ExpertSelectedBrand({ brand, model });
    await newBrand.save();
    res.status(201).json({ message: 'Brand added successfully', brand: newBrand });
  } catch (error) {
    next(new CustomError("Error while adding brands", 500));
  }
});

// Poistoreitti
router.delete('/delete/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const deletedBrand = await ExpertSelectedBrand.findByIdAndDelete(id);
    if (deletedBrand) {
      res.status(200).json({ message: 'Brand deleted successfully' });
    } else {
      throw new CustomError("Brand not found", 404);
    }
  } catch (error) {
    next(error);
  }
});

// Muokkausreitti
router.put('/update/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { brand, model } = req.body;

  try {
    const updatedBrand = await ExpertSelectedBrand.findByIdAndUpdate(id, { brand, model }, { new: true });
    if (updatedBrand) {
      res.status(200).json({ message: 'Brand updated successfully', brand: updatedBrand });
    } else {
      throw new CustomError("Brand not found", 404);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
