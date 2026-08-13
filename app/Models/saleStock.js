const mongoose = require('mongoose');

const saleStockSchema = new mongoose.Schema(
    {
        outwardType: {
            type: String,
            enum: ['Sale', 'Production', 'Transfer'],
            required: true,
        },
        stockPointName: {
            type: String,
            required: true,
        },
        rawMaterialID:{
            type: String,
            required: true,
        },
        rawMaterialName: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
        rate: {
            type: Number,
            required: true,
            default: 0,
        },
        totalSaleAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: String,
            required: true,
           
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SaleStock', saleStockSchema);