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
            date: date,
            vehicleNumber,
            driverName,
            remarks
        });

        return res.status(200).json({
            response: 3,
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


const AddStock = require("../../app/Models/addstock");             // Inward
const SalesStock = require("../../app/Models/saleStock");           // Outward (Sale)
const Expenses = require("../../app/Models/expenses");               // Expense

const gettransfersalestockdata = async (req, res) => {
    try {
        const { location } = req.body;
        console.log("Received request body:", req.body);

        // const page = parseInt(pageNo) > 0 ? parseInt(pageNo) : 1;
        // const pageSize = parseInt(size) > 0 ? parseInt(size) : 20;

        const results = [];


        const filter = {};
        if (location) filter.stockPoint = location; // adjust field name to your schema
        // if (search) filter.material = { $regex: search, $options: "i" };

        const addStocks = await AddStock.find(filter).lean();

        addStocks.forEach(item => {
            results.push({
                _id: item._id,
                type: "Inward",
                title: `${item.materialName || item.itemName} (Purchased)`,
                location: item.warehouse,
                // quantity: `+${item.quantity} KG`,
                quantity: item.quantity,
                amount: item.totalAmount || 0,
                date: getFormattedDate(item.createdAt),
                source: "AddStock"
            });
        });



        // if (!type || type === "All" || type === "Outward") {
        const filter2 = {};
        if (location) filter2.productionUnit = location;
        // if (search) filter2.material = { $regex: search, $options: "i" };

        const salesStocks = await SalesStock.find(filter2).lean();



        salesStocks.forEach(sale => {
            const rawMaterialsList = Array.isArray(sale.rawmaterials) ? sale.rawmaterials : [];

            rawMaterialsList.forEach(rm => {
                // optional search filter applied at material level
                // if (search && !(rm.material || "").toLowerCase().includes(search.toLowerCase())) {
                //     return;
                // }

                results.push({
                    _id: sale._id,
                    type: "Outward",
                    title: `${rm.rawMaterialName || "Material"} (Sold)`,
                    location: sale.warehouse,
                    quantity: `-${rm.quantity} KG`,
                    amount: rm.totalSaleAmount || rm.price || 0,
                    date: getFormattedDate(sale.createdAt),
                    source: "SalesStock"
                });
            });
        });


        // salesStocks.forEach(item => {
        //     results.push({
        //         _id: item._id,
        //         type: "Outward",
        //         title: `${item.material || item.itemName} (Sold)`,
        //         location: item.productionUnit,
        //         quantity: `-${item.quantity} KG`,
        //         amount: item.amount || item.price || 0,
        //         date: item.date,
        //         source: "SalesStock"
        //     });
        // });
        // }


        // if (!type || type === "All" || type === "Internal") {
        const filter3 = {};
        if (location) {
            filter3.$or = [
                { sourceWarehouse: location },
                { destinationWarehouse: location }
            ];
        }
        // if (search) filter.material = { $regex: search, $options: "i" };

        const transfers = await TransferSaleStock.find(filter3).lean();

        transfers.forEach(item => {
            results.push({
                _id: item._id,
                type: "Internal",
                title: `${item.material || "Material"} (Transfer)`,
                location: `${item.sourceWarehouse || "-"} → ${item.destinationWarehouse || "-"}`,
                quantity: `${item.quantity} KG`,
                amount: 0,
                date:formatExpenseDate(item.date),
                source: "TransferSaleStock"
            });
        });
        // }


        // if (!type || type === "All" || type === "Expense") {
        const filter4 = {};
        if (location) filter4.stockPointName = location;
        // if (search) filter4.title = { $regex: search, $options: "i" };

        const expenses = await Expenses.find(filter4).lean();

        expenses.forEach(item => {
            results.push({
                _id: item._id,
                type: "Expense",
                title: item.expenseCategory || item.expenseType,
                location: item.stockPointName,
                quantity: item.quantity ? `${item.quantity} KG` : 0,
                amount: item.amount,
                date: formatExpenseDate(item.expenseDate),
                source: "Expenses"
            });
        });
        // }


        results.sort((a, b) => new Date(b.date) - new Date(a.date));

        const totalCount = results.length;
        //const paginated = results.slice((page - 1) * pageSize, page * pageSize);

        return res.status(200).json({
            success: true,
            // pageNo: page,
            // size: pageSize,
            totalCount,
            // totalPages: Math.ceil(totalCount / pageSize),
            data: results
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = { addtransfersalestockdata, gettransfersalestockdata };

function getFormattedDate(date) {
    if (!date) return null;

    const d = new Date(date);
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const day = String(d.getDate()).padStart(2, "0");
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
}

function formatExpenseDate(dateStr) {
    if (!dateStr) return null;

    const [day, month, year] = dateStr.split("/");

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthIndex = parseInt(month, 10) - 1;

    return `${day} ${monthNames[monthIndex]} ${year}`;
}