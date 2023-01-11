import mongoose from 'mongoose'

/**
 * Provider Schema
 */
const PoolSchema = new mongoose.Schema({
    event_id: {
        type: String,
    },
    block: {
        type: String,
    },
    pool: {
        type: String,
    },
    event_name: {
        type: String,
    },
    from: {
        type: String,
    },
    to: {
        type: String,
    },
    amount: {
        type: String,
    },
    shares: {
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
PoolSchema.method({})


/**
 * @typedef Pool
 */
export default mongoose.models.Pool ||
    mongoose.model('Pool', PoolSchema)
