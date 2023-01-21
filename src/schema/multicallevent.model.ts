import mongoose from 'mongoose'

/**
 * Provider Schema
 */
const MulticallEventSchema = new mongoose.Schema({
    tx: {
        type: String,
    },
    pool_address: {
        type: String,
    },
    id_address: {
        type: String,
    },
    block: {
        type: String,
    },
    borrower: {
        type: String,
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
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
MulticallEventSchema.method({})


/**
 * @typedef MulticallEvent
 */
export default mongoose.models.MulticallEvent ||
    mongoose.model('MulticallEvent', MulticallEventSchema)
