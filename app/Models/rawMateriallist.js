const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema(
    {
        rawmaterialID:{
            type: String,
            required: true,
        },
        stockPoints:{
            type:Array,
            required:false,
            default:[]
        },
        rawmaterials:{
             type:Array,
            required:false,
            default:[]
        },
        feedBags:{
             type:Array,
            required:false,
            default:[]
        }
    }
);

module.exports = mongoose.model('RawMaterialList', rawMaterialSchema);