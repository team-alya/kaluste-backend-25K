/*import mongoose from "mongoose";

const { Schema } = mongoose;

export const kuntoOptions = [
  "Uusi",
  "Erinomainen",
  "Hyvä",
  "Kohtalainen",
  "Huono",
  "Ei tiedossa",
] as const;

const evaluationSchema = new Schema ({
    image: {
        type: Buffer,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
      },
    timeStamp: { 
        type: Date, 
        default: Date.now 
    },
    evaluation: {
        brand: {
            type: String,
            required: false,
            default: "Ei tiedossa",
        },
        model: {
            type: String,
            required: false,
            default: "Ei tiedossa"
        },
        color: {
            type: String,
            required: false,
            default: "Ei tiedossa"
        },
        dimensions: {
            length: {
                type: Number,
                required: false,
                default: 0,
            },
            width: {
                type: Number,
                required: false,
                default: 0,
            },
            height: {
                type: Number,
                required: false,
                default: 0,
            }
        },
        materials: [
            {
                material: {
                    type: String,
                    required: false,
                    default: "Ei tiedossa",
                }
            }
        ],
        condition: {
            type: String,
            enum: kuntoOptions,  // TÄRKEÄ KORJAUS: enum määritellään näin
            required: false,  // Voi olla pakollinen tai ei
            default: "Ei tiedossa"  // Oletusarvo, jos ei anneta arvoa
        },
    },
});

evaSchema.set('toJSON', {
    transform: (_document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
});

const Evaluation = mongoose.model("Evaluation", evaluationSchema);
export default Evaluation;

*/