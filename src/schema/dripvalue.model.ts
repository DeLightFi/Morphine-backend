import mongoose from 'mongoose'

/**
 * Provider Schema
 */
const DripValueSchema = new mongoose.Schema({
    owner: {
        type: String,
    },
    pool: {
        type: String,
    },
    user_balance: {
        type: String,
    },
    total_balance: {
        type: String,
    },
    total_weighted_balance: {
        type: String,
    },
    debt: {
        type: String,
    },
    health_factor: {
        type: String,
    },
    date: {
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
DripValueSchema.method({})


/**
 * @typedef DripValue
 */
export default mongoose.models.DripValue ||
    mongoose.model('DripValue', DripValueSchema)
