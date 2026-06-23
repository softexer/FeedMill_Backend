const mongoose = require('mongoose');

const addStockSchema = new mongoose.Schema(
    {
        stockPointID:{
         type: String,
            required: true,
        },
        stockPoint: {
            type: String,
            required: true
        },
        materialName: {
            type: String,
            required: true,
          
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
        unit: {
            type: String,
            required: true,
            trim: true,
            default: 'KG',
        },
        ratePerUnit: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        supplierName: {
            type: String,
            trim: true,
            default: '',
        },
        supplierPhone: {
            type: String,
            trim: true,
            default: '',
        },
        remarks: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('AddStock', addStockSchema);