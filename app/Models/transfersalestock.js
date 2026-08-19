const mongoose = require('mongoose');



const TransferSaleStockSchema =  new mongoose.Schema({
    outwardType: {
        type: String,
        required: true,
        enum: ['Sale', 'Production', 'Transfer'],
        default: 'Transfer',
        index: true
    },

    sourceWarehouse: {
        type: String,
        required:false
         },

    destinationWarehouse: {
        type: String,
       required:false
    },

    materialType: {
        type: String,
        enum: ['RawMaterials', 'FeedBags'],
        required: true
    },

    material: {
        type: String,
        required: false
    },

    quantity: {
        type: Number,
        required: False,
        default: 0
    },

    date: {
        type: Date,
        required: true,
        default: () => new Date()
    },

     vehicleNumber: { type: String, trim: true },
    driverName: { type: String, trim: true },

    remarks: { type: String, trim: true },

    
}, );

module.exports = mongoose.model('TransferSaleStock', TransferSaleStockSchema);