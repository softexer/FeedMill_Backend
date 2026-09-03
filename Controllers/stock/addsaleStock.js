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
        var spoint;
        // INSERT DATA
        var rawmaterialarray = [];
        if (params.outwardType == "Sale") {
            spoint = params.stockPointName;
        }
        else {
            spoint = params.productionUnit;
        }

        // for (var i = 0; i < rawmaterials.length; i++) {
        //     const point = rawmaterials[i];
        //     const rawMaterialName = typeof point === "string"
        //         ? point
        //         : point.rawMaterialName || point.rawmaterialname || point.name;
        //     rawmaterialarray.push({
        //         rawMaterialID: rawMaterialID,
        //         rawMaterialName: rawMaterialName,
        //         quantity: quantity,
        //         rate: rate,
        //         totalSaleAmount: totalSaleAmount,
        //     });
        // }


        for (var i = 0; i < rawmaterials.length; i++) {
            const point = rawmaterials[i];
            const rawMaterialName = typeof point === "string"
                ? point
                : point.rawMaterialName || point.rawmaterialname || point.name;

            // If each item carries its own qty/rate/id, prefer those over the outer ones
            const itemRawMaterialID = (typeof point === "object" && point.rawMaterialID) || point.rawMaterialID;
            const itemQuantity = (typeof point === "object" && point.quantity) || point.quantity;
            const itemRate = (typeof point === "object" && point.rate) || point.rate;
            const itemTotalAmount = itemQuantity * itemRate;

            console.log("data", itemQuantity, itemRate)

            rawmaterialarray.push({
                rawMaterialID: itemRawMaterialID,
                rawMaterialName: rawMaterialName,
                quantity: itemQuantity,
                rate: itemRate,
                totalSaleAmount: itemTotalAmount,
            });

            const batches = await AddStocks.find({
                materialName: rawMaterialName,
                stockPoint: spoint,
                quantity: { $gt: 0 }
            }).sort({ createdAt: 1 }); // oldest batch first (FIFO)

            const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);

            if (totalAvailable < itemQuantity) {
                throw new Error(`Insufficient stock for "${rawMaterialName}" at "${spoint}". Needed: ${itemQuantity}, Available: ${totalAvailable}`);
            }

            let remaining = itemQuantity;
            const deductedBatches = [];

            for (const batch of batches) {
                if (remaining <= 0) break;

                const takeFromThisBatch = Math.min(batch.quantity, remaining);
                const amountDeducted = takeFromThisBatch * batch.ratePerUnit;

                const updatedStock = await AddStocks.findOneAndUpdate(
                    {
                        _id: batch._id,
                        quantity: { $gte: takeFromThisBatch }
                    },
                    {
                        $inc: {
                            quantity: -takeFromThisBatch,
                            totalAmount: -itemTotalAmount
                        }
                    },
                    { returnDocument: "after" }
                );

                // if (!updatedStock) {
                //     throw new Error(`Stock batch ${batch._id} changed concurrently. Please retry.`);
                // }

                deductedBatches.push({ batchId: batch._id, taken: takeFromThisBatch, ratePerUnit: batch.ratePerUnit });
                remaining -= takeFromThisBatch;
            }


            // if (!updatedStock) {

            //     return res.status(200).json({
            //         response: 3,
            //         message: `Insufficient stock for raw material: ${rawMaterialName}`
            //     });
            // }
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
