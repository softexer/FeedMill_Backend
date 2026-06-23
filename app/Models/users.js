var mongoose = require('mongoose');
var dbs = require('./DBConnection')
var schema = mongoose.Schema;
var customer = new schema({
    PhoneNumber: {
        type: String,
        required: false
    },
    RegisterType: {
        type: Number,
        required: false,
    },
    Address: {
        type: String,
        required: false
    },
    profilePic: {
        type: String,
        required: false
    },
    customerName: {
        type: String,
        required: false
    },
    AmountPaid: {
        type: Number,
        required: false,
        default: 0
    },
    closingBalance: {
        type: Number,
        required: false,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: false,
        default: 0
    },
    cashInHand: {
        type: Number,
        required: false,
        default: 0
    },
    TotalExpense: {
        type: Number,
        required: false,
        default: 0
    },

});
dbs.connectToDB();
module.exports = mongoose.model('customers', customer)