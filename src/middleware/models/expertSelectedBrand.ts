import mongoose, { Schema } from 'mongoose';

// This schema defines the structure of the expert selected brand data
const expertSelectedBrandSchema = new Schema({
  brand: {
    type: String,
    required: false,
  },
  model: {
    type: String,
    required: false,
  },
  }, 
  {
    validateBeforeSave: true
  });

expertSelectedBrandSchema.pre('save', function (next) {
  if (!this.brand && !this.model) {
    return next(new Error('Either brand or model must be provided'));
  }
  next();
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
