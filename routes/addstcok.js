var express = require('express');
var router = express.Router();
var ReceviedStock = require('../Controllers/stock/addstock');
var fetchReceivedStock = require('../Controllers/stock/fetchstock');
var adminstcokpoints = require('../Controllers/stock/addrawmaterial');
var expensespoint = require('../Controllers/stock/addExpenses');
var salesendpoint = require('../Controllers/stock/addsaleStock')
var transfersalestockendpoint = require('../Controllers/stock/transfersalestock')

var fileupload = require('express-fileupload');
router.use(fileupload({ limits: { fileSize: 50 * 1024 * 1024 } }));
router.post("/addstock", (req, res) => {
    ReceviedStock.addPurchasedStock(req, res)
})
router.post("/fetchstock", (req, res) => {
    fetchReceivedStock.fetchreceivedstocksdata(req, res)
})
router.post("/addadminstockpoints", (req, res) => {
    adminstcokpoints.addrawmateriallist(req, res)
})
router.get("/fetchadminstockpoints", (req, res) => {
    adminstcokpoints.fetchadminstockpoints(req, res)
})
router.put("/updatestockpoints", (req, res) => {
    adminstcokpoints.updateStockPoints(req, res)
})
router.delete("/deletestockpoints", (req, res) => {
    adminstcokpoints.deleteStockPoints(req, res)
})

router.post("/addexpenses", (req, res) => {
    expensespoint.addPurchasedStock(req, res)
})

router.post("/addsalestock", (req, res) => {
    salesendpoint.addsalestockdata(req, res)
})

router.post("/addtransfersalestock", (req, res) => {
    transfersalestockendpoint.addtransfersalestockdata(req, res)
})

router.post("/transactions", (req, res) => {
    transfersalestockendpoint.gettransfersalestockdata(req, res)
})

const AddStock = require("../app/Models/addstock");
const SalesStock = require("../app/Models/saleStock");
const Expenses = require("../app/Models/expenses");
const TransferSaleStock = require("../app/Models/transfersalestock");

/**
 * Get start/end date range based on period selection
 */
function getDateRange(period) {
    const now = new Date();
    let start, end;

    if (period === "LastMonth") {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === "Last3Months") {
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
        // "ThisMonth" - default
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return { start, end };
}

function getPreviousDateRange(period) {
    const now = new Date();
    let start, end;

    if (period === "LastMonth") {
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
    } else if (period === "Last3Months") {
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        end = new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59);
    } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    return { start, end };
}

/**
 * Parses a "dd/mm/yyyy" string into a real JS Date object.
 * Used for SalesStock, Expenses, and TransferSaleStock, since all three
 * store their date as a dd/mm/yyyy string, not a native Date.
 */
function parseDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split("/");
    if (!day || !month || !year) return null;
    return new Date(`${year}-${month}-${day}`);
}

/**
 * Filters an array of documents down to only those whose given
 * string-date field falls within [start, end].
 */
function filterByStringDate(docs, dateFieldName, start, end) {
    return docs.filter(doc => {
        const parsed = parseDDMMYYYY(doc[dateFieldName]);
        if (!parsed) return false;
        return parsed >= start && parsed <= end;
    });
}

async function calculatePL(start, end) {
    // --------------------------------------------------
    // 1) AddStock — uses real createdAt (Date object), filter directly in query
    // --------------------------------------------------
    const addStocks = await AddStock.find({
        createdAt: { $gte: start, $lte: end }
    }).lean();

    const purchaseCost = addStocks.reduce((sum, item) => sum + (item.amount || item.price || 0), 0);

    // --------------------------------------------------
    // 2) SalesStock — date stored as "dd/mm/yyyy" string, filter in JS after fetch
    // --------------------------------------------------
    const allSalesStocks = await SalesStock.find({}).lean();
    const salesStocks = filterByStringDate(allSalesStocks, "date", start, end);

    let feedBagSales = 0;
    let rawMaterialSales = 0;

    salesStocks.forEach(sale => {
        const items = Array.isArray(sale.rawmaterials) ? sale.rawmaterials : [];
        items.forEach(item => {
            const amount = item.amount || item.price || 0;
            if ((item.category || "").toLowerCase() === "feedbags" || (item.materialType || "").toLowerCase() === "feedbags") {
                feedBagSales += amount;
            } else {
                rawMaterialSales += amount;
            }
        });
    });

    const totalRevenue = feedBagSales + rawMaterialSales;

    // --------------------------------------------------
    // 3) Expenses — date stored as "dd/mm/yyyy" string (expenseDate field)
    // --------------------------------------------------
    const allExpenses = await Expenses.find({}).lean();
    const filteredExpenses = filterByStringDate(allExpenses, "expenseDate", start, end);
    const operationalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // --------------------------------------------------
    // 4) TransferSaleStock — date stored as "dd/mm/yyyy" string (date field)
    //    Included for completeness (internal transfers), but does NOT
    //    affect revenue or expense totals since it's neither a sale nor a cost.
    // --------------------------------------------------
    const allTransfers = await TransferSaleStock.find({}).lean();
    const filteredTransfers = filterByStringDate(allTransfers, "date", start, end);
    const transferCount = filteredTransfers.length;
    const transferQuantity = filteredTransfers.reduce((sum, t) => sum + (t.quantity || 0), 0);

    const totalExpenses = purchaseCost + operationalExpenses;
    const netProfit = totalRevenue - totalExpenses;

    return {
        totalRevenue,
        totalExpenses,
        feedBagSales,
        rawMaterialSales,
        netProfit,
        transferCount,
        transferQuantity
    };
}

router.get("/reports/profit-loss", async (req, res) => {
    try {
        const { period } = req.query;
        const selectedPeriod = period || "ThisMonth";

        const { start, end } = getDateRange(selectedPeriod);
        const current = await calculatePL(start, end);

        // Previous period, for % change
        const { start: prevStart, end: prevEnd } = getPreviousDateRange(selectedPeriod);
        const previous = await calculatePL(prevStart, prevEnd);

        let percentChange = 0;
        if (previous.netProfit !== 0) {
            percentChange = ((current.netProfit - previous.netProfit) / Math.abs(previous.netProfit)) * 100;
        } else if (current.netProfit !== 0) {
            percentChange = 100;
        }

        return res.status(200).json({
            success: true,
            period: selectedPeriod,
            dateRange: { start, end },
            data: {
                netProfit: current.netProfit,
                percentChange: Math.round(percentChange * 10) / 10,
                trend: percentChange >= 0 ? "up" : "down",
                totalRevenue: current.totalRevenue,
                totalExpenses: current.totalExpenses,
                feedBagSales: current.feedBagSales,
                rawMaterialSales: current.rawMaterialSales,
                transferCount: current.transferCount,
                transferQuantity: current.transferQuantity
            }
        });

    } catch (error) {
        console.error("Error generating P&L report:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


module.exports = router;