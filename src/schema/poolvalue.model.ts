import mongoose from 'mongoose'

/**
 * Provider Schema
 */
const PoolValueSchema = new mongoose.Schema({
    pool_address: {
        type: String,
    },
    borrowrate: {
        type: String,
    },
    supplyrate: {
        type: String,
    },
    totalassets: {
        type: String,
    },
    totalborrows: {
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
PoolValueSchema.method({})


/**
 * @typedef PoolValue
 */
export default mongoose.models.PoolValue ||
    mongoose.model('PoolValue', PoolValueSchema)
