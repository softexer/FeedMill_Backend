const mongoose = require('mongoose');
var dbs = require('./DBConnection')
var schema = mongoose.Schema;
const addStockSchema = new schema(
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
            default: 'KG',
        },
        ratePerUnit: {
            type: Number,
            required: true,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        supplierName: {
            type: String,
           
            default: '',
        },
        supplierPhone: {
            type: String,
          
            default: '',
        },
        remarks: {
            type: String,
           
            default: '',
        },
    },
    {
        timestamps: true,
    }
);
dbs.connectToDB();
module.exports = mongoose.model('AddStock', addStockSchema)
