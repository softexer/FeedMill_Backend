const db = require("../stock");

const PurchasedStock = ('../../app/Model/addstock');

exports.addPurchasedStock = async (req, res) => {
    try {
        const {
            stockPoint,
            materialName,
            quantity,
            unit,
            ratePerUnit,
            supplierName,
            supplierPhone,
            remarks
        } = req.body;
        

        if (   !stockPoint|| !quantity || !ratePerUnit) {
            return res.status(400).json({
                success: false,
                message: "stockPoint, quantity and ratePerUnit are required"
            });
        }

        const qty = parseFloat(quantity);
        const rate = parseFloat(ratePerUnit);

        if (Number.isNaN(qty) || Number.isNaN(rate)) {
            return res.status(400).json({
                success: false,
                message: "quantity and ratePerUnit must be numeric"
            });
        }

        const totalAmount = qty * rate;

        const stockEntry = await PurchasedStock.create({
            stockPointID: stockPoint || `SP-${require('crypto').randomBytes(8).toString('hex')}`,
            stockPoint: stockPoint || null,
            materialName: materialName || null,
            quantity: qty,
            unit: unit || "KG",
            ratePerUnit: rate,
            totalAmount,
            supplierName: supplierName || null,
            supplierPhone: supplierPhone || null,
            remarks: remarks || null
        });

        return res.status(200).json({
            success: 3,
            message: "Purchased stock inserted successfully",
            data: stockEntry
        });
    } catch (error) {
        return res.status(500).json({
            success: 0,
            message: "Failed to insert purchased stock",
            error: error.message
        });
    }
};