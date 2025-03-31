import express, { Request, Response } from 'express';
import ExpertSelectedBrand from '@/middleware/models/expertSelectedBrand';
import { verifyToken } from '@/middleware/auth';
import { requiredRole } from '@/middleware/roleChecker';

const router = express.Router();

// Löytöreitti
router.get('/all', verifyToken,
  requiredRole("customer", "expert", "admin"), async (_req: Request, res: Response) => {
  try {
    const brands = await ExpertSelectedBrand.find();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving brands', error });
  }
});

// Lisäysreitti
router.post('/add', verifyToken,
  requiredRole("expert", "admin"), async (req: Request, res: Response) => {
  const { brand, model } = req.body;

  try {
    const newBrand = new ExpertSelectedBrand({ brand, model });
    await newBrand.save();
    res.status(201).json({ message: 'Brand added successfully', brand: newBrand });
  } catch (error) {
    res.status(500).json({ message: 'Error adding brand', error });
  }
});

// Poistoreitti
router.delete('/delete/:id', verifyToken,
  requiredRole("expert", "admin"), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedBrand = await ExpertSelectedBrand.findByIdAndDelete(id);
    if (deletedBrand) {
      res.status(200).json({ message: 'Brand deleted successfully' });
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting brand', error });
  }
});

// Muokkausreitti
router.put('/update/:id', verifyToken,
  requiredRole("customer", "expert", "admin"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { brand, model } = req.body;

  try {
    const updatedBrand = await ExpertSelectedBrand.findByIdAndUpdate(id, { brand, model }, { new: true });
    if (updatedBrand) {
      res.status(200).json({ message: 'Brand updated successfully', brand: updatedBrand });
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating brand', error });
  }
});

export default router;
