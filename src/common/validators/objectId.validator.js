import mongoose from 'mongoose';

const validateObjectId = val => {
    // If it's already a MongoDB ObjectID instance, keep it
    if (val instanceof mongoose.Types.ObjectId) {
        return val;
    }

    // If it's an object with an _id field (populated document or request object)
    if (typeof val === 'object' && val !== null) {
        // Extract the _id, which could be an ObjectId or a string
        const id = val._id;

        if (id instanceof mongoose.Types.ObjectId) {
            return id;
        }

        if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
            return new mongoose.Types.ObjectId(id);
        }

        // If we have an object but couldn't extract a valid ID, throw an error
        throw new Error('Invalid category: object must have a valid _id property');
    }

    // If it's a string that's a valid ObjectId, convert it
    if (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)) {
        return new mongoose.Types.ObjectId(val);
    }

    // If we reach here, the value is invalid
    throw new Error('Invalid category ID format');
}

export default validateObjectId;