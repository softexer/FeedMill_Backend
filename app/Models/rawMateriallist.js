const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema(
    {
        adminrawmaterialID: {
            type: String,
            required: true,
        },
        stockPoints: [
            {
                stockPointID: String,
                stockPointName: {
                    type: String,
                    unique: true
                }
            }
        ],
        rawmaterials: [
            {
                rawMaterialID: String,
                rawMaterialName: {
                    type: String,
                    unique: true
                }
            }
        ],
        feedBags: [
            {
                feedBagID: String,
                feedBagName: {
                    type: String,
                    unique: true
                }
            }
        ],
    }
);

module.exports = mongoose.model('RawMaterialList', rawMaterialSchema);