var SaleStockData = require('../../app/Models/saleStock');
var idb = require('../core/generateID');

const addsalestockdata = async (req, res) => {
    try {

        const {
            outwardType,
            stockPointName,
            rawMaterialID,
            rawMaterialName,
            quantity,
            rate,
            totalSaleAmount,
            customerName,
            date,
            remarks,
            // productionUnit,
            // finishedProduct,
            
        } = params;

        if (!outwardType || !stockPointName || !rawMaterialID || !rawMaterialName || !quantity || !rate || !totalSaleAmount || !customerName || !date || !remarks) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        // INSERT DATA


        if (params.outwardType == "Sale") {
            await SaleStockData.create({
                SalestockID: "sale@" + idb.GenerateIDS(5),
                outwardType: params.outwardType,
                stockPointName: params.stockPointName,
                rawMaterialID: params.rawMaterialID,
                rawMaterialName: params.rawMaterialName,
                quantity: params.quantity,
                rate: params.rate,
                totalSaleAmount: params.totalSaleAmount,
                customerName: params.customerName,
                date: params.date,
                remarks: params.remarks
            });
        }



        return res.status(200).json({
            response: 3,
            message: "Sale data inserted successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { addsalestockdata };
