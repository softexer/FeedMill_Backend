var SaleStockData = require('../../app/Models/saleStock');
var idb = require('../core/generateID');
var AddStocks = require('../../app/Models/addstock');
const addsalestockdata = async (req, res) => {
    try {

        // const {
        //     outwardType,
        //     stockPointName,
        //     rawMaterialID,
        //     rawMaterialName,
        //     quantity,
        //     rate,
        //     totalSaleAmount,
        //     customerName,
        //     date,
        //     remarks,
        //     rawmaterials = [],
        //     producedQuantity,
        //     productionUnit,
        //     finishedProduct,
        //     batchNumber
        // } = req.body;

        const {
            outwardType,
            customerName,
            date,
            remarks,
            rawmaterials = [],
            producedQuantity,
            productionUnit,
            finishedProduct,
            batchNumber
        } = req.body;
        var params = req.body;

        // INSERT DATA
        var rawmaterialarray = [];

        for (var i = 0; i < rawmaterials.length; i++) {
            const point = rawmaterials[i];
            const rawMaterialName = typeof point === "string"
                ? point
                : point.rawMaterialName || point.rawmaterialname || point.name;
            rawmaterialarray.push({
                rawMaterialID: rawMaterialID,
                rawMaterialName: rawMaterialName,
                quantity: quantity,
                rate: rate,
                totalSaleAmount: totalSaleAmount,
            });
        }


        for (var i = 0; i < rawmaterials.length; i++) {
            const point = rawmaterials[i];
            const rawMaterialName = typeof point === "string"
                ? point
                : point.rawMaterialName || point.rawmaterialname || point.name;

            // If each item carries its own qty/rate/id, prefer those over the outer ones
            const itemRawMaterialID = (typeof point === "object" && point.rawMaterialID) || rawMaterialID;
            const itemQuantity = (typeof point === "object" && point.quantity) || quantity;
            const itemRate = (typeof point === "object" && point.rate) || rate;
            const itemTotalAmount = itemQuantity * itemRate;

            console.log("data",itemQuantity,itemRate)

            rawmaterialarray.push({
                rawMaterialID: itemRawMaterialID,
                rawMaterialName: rawMaterialName,
                quantity: itemQuantity,
                rate: itemRate,
                totalSaleAmount: itemTotalAmount,
            });

            const updatedStock = await AddStocks.findOneAndUpdate(
                {
                    rawMaterialName: rawMaterialName,
                    quantity: { $gte: itemQuantity }
                },
                {
                    $inc: {
                        quantity: -itemQuantity,
                        totalAmount: -itemTotalAmount
                    }
                },
                { new: true }
            );

            if (!updatedStock) {

                return res.status(200).json({
                    response: 3,
                    message: `Insufficient stock for raw material: ${rawMaterialName}`
                });
            }
        }




        if (params.outwardType == "Sale") {
            await SaleStockData.create({
                SalestockID: "sale@" + idb.GenerateIDS(5),
                outwardType: params.outwardType,
                stockPointName: params.stockPointName,
                rawmaterials: rawmaterialarray,
                customerName: params.customerName,
                date: params.date,
                remarks: params.remarks
            });
        } else {
            await SaleStockData.create({
                SalestockID: "sale@" + idb.GenerateIDS(5),
                outwardType: params.outwardType,
                productionUnit: params.productionUnit,
                finishedProduct: params.finishedProduct,
                batchNumber: params.batchNumber,
                rawmaterials: rawmaterialarray,
                producedQuantity: params.producedQuantity,
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
