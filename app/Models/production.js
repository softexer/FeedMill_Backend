const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
    outwardType: {
        type: String,
        enum: ['Sale', 'Production', 'Transfer'],
        required: true
    },
    productionUnit: {
        type: String,
        required: true
    },
    finishedProduct: {
        type: String,
        required: true
    },
    rawMaterialsConsumed: [
        {
            rawMaterialName: String,
            rawMaterialID:String,
            quantity: Number,
        }
    ],
    producedQuantity: {
        type: Number,
        required: true
    },
    // quantityUnit: {
    //     type: String,
    //     default: 'Bags'
    // },
    batchNumber: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: String,
        required: true
    },
    remarks: {
        type: String,
        required: true
    },
   
});

module.exports = mongoose.model('Production', productionSchema);