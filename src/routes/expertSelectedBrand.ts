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

  if (!brand?.trim() && !model?.trim()) {
    return res.status(400).json({ message: 'Either brand or model must be provided and cannot be empty' });
  }

  try {
    const newEntry = new ExpertSelectedBrand({});
    if (brand?.trim()) newEntry.brand = brand.trim();
    if (model?.trim()) newEntry.model = model.trim();

    await newEntry.save();
    return res.status(201).json({ message: 'Entry added successfully', entry: newEntry });
  } catch (error) {

    next(new CustomError("Error while adding brands", 500));

  }
});

// Poistoreitti
router.delete('/delete/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const deletedEntry = await ExpertSelectedBrand.findByIdAndDelete(id);
    if (deletedEntry) {
      res.status(200).json({ message: 'Entry deleted successfully' });
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

    const existingEntry = await ExpertSelectedBrand.findById(id);
    if (!existingEntry) {
        throw new CustomError('Entry not found', 404);
    }

    const updateData: any = {};
    if (brand !== undefined && existingEntry.brand !== undefined) updateData.brand = brand;
    if (model !== undefined && existingEntry.model !== undefined) updateData.model = model;

    if (Object.keys(updateData).length === 0) {
        throw new CustomError('No valid fields to update', 400);
    }

    const updatedEntry = await ExpertSelectedBrand.findByIdAndUpdate(id, updateData, { new: true });
    return res.status(200).json({ message: 'Entry updated successfully', entry: updatedEntry });
} catch (error) {
    next(error);
}

});

export default router;
