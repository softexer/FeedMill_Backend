
var StockData = require('../../app/Models/addstock.js');
var rawmateriallist = require('../../app/Models/rawMateriallist')

//var fetchreceivedstocksdata = async (req, res) => {
exports.fetchreceivedstocksdata = async (req, res) => {
    try {
        const {
            stockPoint
        } = req.body;


        if (!stockPoint) {
            return res.status(400).json({
                success: false,
                message: "stockPoint is required"
            });
        }
        const stockEntry = await StockData.aggregate([  // <-- adjust to your raw material model
            {
                $match: {
                    $expr: {
                        $eq: [
                            { $toLower: "$stockPoint" },
                            stockPoint.toLowerCase()
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$materialName",
                    totalQuantity: { $sum: "$quantity" },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: "rawMaterial",
                    materialName: "$_id",
                    totalQuantity: 1,
                    totalAmount: 1,
                    unitPrice: {
                        $cond: [
                            { $eq: ["$totalQuantity", 0] },
                            0,
                            { $divide: ["$totalAmount", "$totalQuantity"] }
                        ]
                    }
                }
            },
            {
                // Pulls in results from the finished-products collection into
                // the SAME result stream, in this one query
                $unionWith: {
                    coll: "salestocks", // <-- actual MongoDB collection name (check with FinishedProductStock.collection.name)
                    pipeline: [
                        {
                            $match: { outwardType: "Production" },


                        },
                        {
                            $group: {
                                _id: "$finishedProduct",
                                totalProducedQuantity: { $sum: "$producedQuantity" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                type: "finishedProduct",
                                finishedProductName: "$_id",
                                totalProducedQuantity: 1
                            }
                        }
                    ]
                }
            }
        ]);
        if (!stockEntry || stockEntry.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Stock entry not found"
            });
        }
        const adminData = await rawmateriallist.findOne({});
        res.json({
            success: true,
            message: "Stock entry fetched successfully",
            data: stockEntry,
            rawmaterialData: adminData
        });

    } catch (error) {
        console.log(error)
    }

}
// module.exports = {
//     fetchreceivedstocksdata
// }