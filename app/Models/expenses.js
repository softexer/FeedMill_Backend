const mongoose = require('mongoose');

const { Schema } = mongoose;

const AttachmentSchema = new Schema({
    filename: { type: String },
    url: { type: String },
    mimeType: { type: String }
}, { _id: false });

const ExpenseSchema = new Schema({
    stockPointName: {
        type: String,
        required: true
    },
    expenseCategory: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    expenseDate: {
        type: String,
        required: false,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    attachment: {
        type: String,
        required: false,
        default: ""
    },
    createdBy: {
        type:String,
       required: false,
    }
});

module.exports = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);