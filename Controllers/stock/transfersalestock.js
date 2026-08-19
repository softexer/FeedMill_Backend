const TransferSaleStock = require("../../app/Models/transfersalestock"); 
const addtransfersalestockdata = async (req, res) => {
    try {
        const {
            outwardType,
            sourceWarehouse,
            destinationWarehouse,
            materialType,
            material,
            quantity,
            date,
            vehicleNumber,
            driverName,
            remarks
        } = req.body;

        if (!materialType) {
            return res.status(400).json({
                success: false,
                message: "materialType is required"
            });
        }

        const newTransfer = await TransferSaleStock.create({
            outwardType: outwardType || "Transfer",
            sourceWarehouse,
            destinationWarehouse,
            materialType,
            material,
            quantity: quantity || 0,
            date: date ? new Date(date) : new Date(),
            vehicleNumber,
            driverName,
            remarks
        });

        return res.status(201).json({
            success: true,
            message: "Stock transfer recorded successfully",
            data: newTransfer
        });

    } catch (error) {
        console.error("Error creating stock transfer:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = { addtransfersalestockdata };