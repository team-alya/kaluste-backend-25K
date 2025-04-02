import mongoose, { Schema } from 'mongoose';


const expertSelectedBrandSchema = new Schema({
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
});


expertSelectedBrandSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});


const ExpertSelectedBrand = mongoose.model('ExpertSelectedBrand', expertSelectedBrandSchema);

export default ExpertSelectedBrand;
