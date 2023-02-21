import mongoose from 'mongoose'

/**
 * Provider Schema
 */
const ActiveDripSchema = new mongoose.Schema({
    block: {
        type: String,
    },
    drip_address: {
        type: String,
    },
    driptransit_address: {
        type: String,
    },
    active: {
        type: Boolean,
        default: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    updated: {
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
ActiveDripSchema.method({})


/**
 * @typedef ActiveDrip
 */
export default mongoose.models.ActiveDrip ||
    mongoose.model('ActiveDrip', ActiveDripSchema)
