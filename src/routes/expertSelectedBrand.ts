import express, { Request, Response } from 'express';
import ExpertSelectedBrand from '@/middleware/models/expertSelectedBrand';

const router = express.Router();

// Löytöreitti
router.get('/all', async (_req: Request, res: Response) => {
    try {
      const brands = await ExpertSelectedBrand.find();
      res.status(200).json(brands);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving brands and models', error });
    }
  });

// Lisäysreitti
router.post('/add', async (req: Request, res: Response) => {
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
    return res.status(500).json({ message: 'Error adding entry', error });
  }
});

// Poistoreitti
router.delete('/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedEntry = await ExpertSelectedBrand.findByIdAndDelete(id);
    if (deletedEntry) {
      res.status(200).json({ message: 'Entry deleted successfully' });
    } else {
      res.status(404).json({ message: 'Entry not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting entry', error });
  }
});

// Muokkausreitti
router.put('/update/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { brand, model } = req.body;

  try {
    const existingEntry = await ExpertSelectedBrand.findById(id);
    if (!existingEntry) {
        return res.status(404).json({ message: 'Entry not found' });
    }

    const updateData: any = {};
    if (brand !== undefined && existingEntry.brand !== undefined) updateData.brand = brand;
    if (model !== undefined && existingEntry.model !== undefined) updateData.model = model;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedEntry = await ExpertSelectedBrand.findByIdAndUpdate(id, updateData, { new: true });
    return res.status(200).json({ message: 'Entry updated successfully', entry: updatedEntry });
} catch (error) {
    return res.status(500).json({ message: 'Error updating entry', error });
}
});

export default router;
