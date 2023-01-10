import mongoose from 'mongoose'

/**
 * Provider Schema
 */
const TestSchema = new mongoose.Schema({
    shopcode: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
TestSchema.method({})


/**
 * @typedef Test
 */
export default mongoose.models.Test ||
    mongoose.model('Test', TestSchema)
