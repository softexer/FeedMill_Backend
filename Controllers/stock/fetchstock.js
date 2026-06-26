
var StockData = require('../../app/Models/addstock.js');
//var fetchreceivedstocksdata = async (req, res) => {
    exports.fetchreceivedstocksdata = async (req, res) => {
    try {
           const {
            stockPoint
        } = req.body;
        

        if (   !stockPoint) {
            return res.status(400).json({
                success: false,
                message: "stockPoint is required"
            });
        }
        const stockEntry = await StockData.aggregate([
            { $match: { stockPoint } },
            { $group: {
            _id: "$materialName",
            totalQuantity: { $sum: "$quantity" },
            totalUnit:{$sum:"$unit"},
            totalAmount: { $sum: "$totalAmount" }

            }},
            { $project: {
            _id: 0,
            materialName: "$_id",
            totalQuantity: 1,
            totalUnit:1,
            totalAmount:1
            }}
        ]);

        if (!stockEntry) {
            return res.status(404).json({
                success: false,
                message: "Stock entry not found"
            });
        }

        res.json({
            success: true,
            message: "Stock entry fetched successfully",
            data: stockEntry
        });

    } catch (error) {
        console.log(error)
    }

}
// module.exports = {
//     fetchreceivedstocksdata
// }