import mongoose from 'mongoose'

/**
 * Provider Schema
 */
const PoolInterestRateModelSchema = new mongoose.Schema({
    pool_address: {
        type: String,
    },
    interestratemodel_address: {
        type: String,
    },
    optimal: {
        type: String,
    },
    baserate: {
        type: String,
    },
    slope1: {
        type: String,
    },
    slope2: {
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
PoolInterestRateModelSchema.method({})


/**
 * @typedef PoolInterestRateModel
 */
export default mongoose.models.PoolInterestRateModel ||
    mongoose.model('PoolInterestRateModel', PoolInterestRateModelSchema)
