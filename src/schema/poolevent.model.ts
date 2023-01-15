import mongoose from 'mongoose'

/**
 * Provider Schema
 */
const PoolEventSchema = new mongoose.Schema({
    event_id: {
        type: String,
    },
    block: {
        type: String,
    },
    pool_address: {
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
PoolEventSchema.method({})


/**
 * @typedef PoolEvent
 */
export default mongoose.models.PoolEvent ||
    mongoose.model('PoolEvent', PoolEventSchema)
