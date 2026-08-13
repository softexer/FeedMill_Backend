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
            required: false,
            default:""
        },
        rawmaterials: [
            {
                rawMaterialID: String,
                rawMaterialName: {
                    type: String,
                    unique: false
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
            }
        ],


        customerName: {
            type: String,
            required: false,

        },
        date: {
            type: String,
            required: true,

        },
        remarks: {
            type: String,
            trim: true,
        },
        productionUnit: {
            type: String,
            required: false,
            default:""
        },
        finishedProduct: {
            type: String,
            required: false,
            default:""
        },
        producedQuantity: {
            type: Number,
            required: false,
            default:0
        },
        batchNumber: {
            type: String,
            required: false,
            default:"",
            unique: true
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SaleStock', saleStockSchema);