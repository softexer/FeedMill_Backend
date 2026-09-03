var express = require('express');
var router = express.Router();
var ReceviedStock = require('../Controllers/stock/addstock');
var fetchReceivedStock = require('../Controllers/stock/fetchstock');
var adminstcokpoints = require('../Controllers/stock/addrawmaterial');
var expensespoint = require('../Controllers/stock/addExpenses');
var salesendpoint = require('../Controllers/stock/addsaleStock')
var transfersalestockendpoint = require('../Controllers/stock/transfersalestock')
const PDFDocument = require("pdfkit");
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






/**
 * ============================================================
 * DATE RANGE
 * ============================================================
 */

function getDateRange(period) {
    const now = new Date();
    let start, end;

    if (period === "LastMonth") {
        start = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

        end = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59,
            999
        );

    } else if (period === "Last3Months") {
        start = new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            1
        );

        end = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );

    } else {
        // ThisMonth
        start = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        end = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );
    }

    return {
        start,
        end
    };
}


/**
 * ============================================================
 * PREVIOUS DATE RANGE
 * ============================================================
 */

function getPreviousDateRange(period) {
    const now = new Date();
    let start, end;

    if (period === "LastMonth") {

        start = new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            1
        );

        end = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            0,
            23,
            59,
            59,
            999
        );

    } else if (period === "Last3Months") {

        start = new Date(
            now.getFullYear(),
            now.getMonth() - 5,
            1
        );

        end = new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            0,
            23,
            59,
            59,
            999
        );

    } else {

        // Previous month
        start = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

        end = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59,
            999
        );
    }

    return {
        start,
        end
    };
}


/**
 * ============================================================
 * DD/MM/YYYY -> DATE
 * ============================================================
 */

function parseDDMMYYYY(dateStr) {

    if (!dateStr) {
        return null;
    }

    const [day, month, year] = dateStr.split("/");

    if (!day || !month || !year) {
        return null;
    }

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    );
}


/**
 * ============================================================
 * FILTER STRING DATE
 * ============================================================
 */

function filterByStringDate(
    docs,
    dateFieldName,
    start,
    end
) {

    return docs.filter(doc => {

        const parsed = parseDDMMYYYY(
            doc[dateFieldName]
        );

        if (!parsed) {
            return false;
        }

        return (
            parsed >= start &&
            parsed <= end
        );
    });
}


/**
 * ============================================================
 * CALCULATE PROFIT & LOSS
 * ============================================================
 */

async function calculatePL(start, end) {

    // --------------------------------------------------------
    // 1. ADD STOCK / PURCHASE
    // --------------------------------------------------------

    const addStocks = await AddStock.find({
        createdAt: {
            $gte: start,
            $lte: end
        }
    }).lean();

    const purchaseCost = addStocks.reduce(
        (sum, item) =>
            sum +
            Number(
                item.amount ||
                item.price ||
                0
            ),
        0
    );


    // --------------------------------------------------------
    // 2. SALES
    // --------------------------------------------------------

    const allSalesStocks =
        await SalesStock.find({}).lean();

    const salesStocks =
        filterByStringDate(
            allSalesStocks,
            "date",
            start,
            end
        );

    let feedBagSales = 0;
    let rawMaterialSales = 0;

    salesStocks.forEach(sale => {

        const items =
            Array.isArray(sale.rawmaterials)
                ? sale.rawmaterials
                : [];

        items.forEach(item => {

            const amount = Number(
                item.amount ||
                item.price ||
                0
            );

            const category =
                String(
                    item.category || ""
                ).toLowerCase();

            const materialType =
                String(
                    item.materialType || ""
                ).toLowerCase();

            if (
                category === "feedbags" ||
                materialType === "feedbags"
            ) {
                feedBagSales += amount;
            } else {
                rawMaterialSales += amount;
            }
        });
    });

    const totalRevenue =
        feedBagSales +
        rawMaterialSales;


    // --------------------------------------------------------
    // 3. EXPENSES
    // --------------------------------------------------------

    const allExpenses =
        await Expenses.find({}).lean();

    const filteredExpenses =
        filterByStringDate(
            allExpenses,
            "expenseDate",
            start,
            end
        );

    const operationalExpenses =
        filteredExpenses.reduce(
            (sum, exp) =>
                sum +
                Number(exp.amount || 0),
            0
        );


    // --------------------------------------------------------
    // 4. TRANSFER STOCK
    // --------------------------------------------------------

    const allTransfers =
        await TransferSaleStock.find({}).lean();

    const filteredTransfers =
        filterByStringDate(
            allTransfers,
            "date",
            start,
            end
        );

    const transferCount =
        filteredTransfers.length;

    const transferQuantity =
        filteredTransfers.reduce(
            (sum, transfer) =>
                sum +
                Number(
                    transfer.quantity || 0
                ),
            0
        );


    // --------------------------------------------------------
    // FINAL CALCULATION
    // --------------------------------------------------------

    const totalExpenses =
        purchaseCost +
        operationalExpenses;

    const netProfit =
        totalRevenue -
        totalExpenses;


    return {

        totalRevenue,

        totalExpenses,

        purchaseCost,

        operationalExpenses,

        feedBagSales,

        rawMaterialSales,

        netProfit,

        transferCount,

        transferQuantity
    };
}


/**
 * ============================================================
 * FORMAT AMOUNT
 * ============================================================
 */

function formatAmount(amount) {

    return Number(
        amount || 0
    ).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/**
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


/**
 * ============================================================
 * PDF ROW
 * ============================================================
 */

function addPDFRow(
    doc,
    label,
    value
) {

    const y = doc.y;

    doc
        .fontSize(11)
        .font("Helvetica")
        .text(
            label,
            60,
            y,
            {
                width: 300
            }
        );

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
            String(value),
            380,
            y,
            {
                width: 150,
                align: "right"
            }
        );

    doc.moveDown(0.7);
}


/**
 * ============================================================
 * EXISTING JSON API
 *
 * GET /reports/profit-loss?period=ThisMonth
 * ============================================================
 */

router.get(
    "/reports/profit-loss",
    async (req, res) => {

        try {

            const {
                period
            } = req.query;

            const selectedPeriod =
                period || "ThisMonth";


            // Current period
            const {
                start,
                end
            } = getDateRange(
                selectedPeriod
            );

            const current =
                await calculatePL(
                    start,
                    end
                );


            // Previous period
            const {
                start: prevStart,
                end: prevEnd
            } = getPreviousDateRange(
                selectedPeriod
            );

            const previous =
                await calculatePL(
                    prevStart,
                    prevEnd
                );


            // Percentage change
            let percentChange = 0;

            if (
                previous.netProfit !== 0
            ) {

                percentChange =
                    (
                        (
                            current.netProfit -
                            previous.netProfit
                        ) /
                        Math.abs(
                            previous.netProfit
                        )
                    ) * 100;

            } else if (
                current.netProfit !== 0
            ) {

                percentChange = 100;
            }


            percentChange =
                Math.round(
                    percentChange * 10
                ) / 10;


            return res.status(200).json({

                success: true,

                period:
                    selectedPeriod,

                dateRange: {
                    start,
                    end
                },

                data: {

                    netProfit:
                        current.netProfit,

                    percentChange,

                    trend:
                        percentChange >= 0
                            ? "up"
                            : "down",

                    totalRevenue:
                        current.totalRevenue,

                    totalExpenses:
                        current.totalExpenses,

                    purchaseCost:
                        current.purchaseCost,

                    operationalExpenses:
                        current.operationalExpenses,

                    feedBagSales:
                        current.feedBagSales,

                    rawMaterialSales:
                        current.rawMaterialSales,

                    transferCount:
                        current.transferCount,

                    transferQuantity:
                        current.transferQuantity
                }
            });

        } catch (error) {

            console.error(
                "Error generating P&L report:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Internal server error",

                error:
                    error.message
            });
        }
    }
);


/**
 * ============================================================
 * SEPARATE PDF DOWNLOAD API
 *
 * GET /reports/profit-loss/pdf?period=ThisMonth
 *
 * ============================================================
 */

router.get(
    "/reports/profit-loss/pdf",
    async (req, res) => {

        try {

            const {
                period
            } = req.query;

            const selectedPeriod =
                period || "ThisMonth";


            // ------------------------------------------------
            // Current period
            // ------------------------------------------------

            const {
                start,
                end
            } = getDateRange(
                selectedPeriod
            );

            const current =
                await calculatePL(
                    start,
                    end
                );


            // ------------------------------------------------
            // Previous period
            // ------------------------------------------------

            const {
                start: prevStart,
                end: prevEnd
            } = getPreviousDateRange(
                selectedPeriod
            );

            const previous =
                await calculatePL(
                    prevStart,
                    prevEnd
                );


            // ------------------------------------------------
            // Percentage change
            // ------------------------------------------------

            let percentChange = 0;

            if (
                previous.netProfit !== 0
            ) {

                percentChange =
                    (
                        (
                            current.netProfit -
                            previous.netProfit
                        ) /
                        Math.abs(
                            previous.netProfit
                        )
                    ) * 100;

            } else if (
                current.netProfit !== 0
            ) {

                percentChange = 100;
            }

            percentChange =
                Math.round(
                    percentChange * 10
                ) / 10;


            // ------------------------------------------------
            // CREATE PDF
            // ------------------------------------------------

            const doc =
                new PDFDocument({
                    size: "A4",
                    margin: 50
                });


            const fileName =
                `profit-loss-${selectedPeriod}.pdf`;


            // ------------------------------------------------
            // RESPONSE HEADERS
            // ------------------------------------------------

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${fileName}"`
            );


            // Pipe PDF directly to browser
            doc.pipe(res);


            // =================================================
            // HEADER
            // =================================================

            doc
                .fontSize(22)
                .font("Helvetica-Bold")
                .text(
                    "Profit & Loss Report",
                    {
                        align: "center"
                    }
                );

            doc.moveDown();


            doc
                .fontSize(11)
                .font("Helvetica")
                .text(
                    `Period: ${selectedPeriod}`,
                    {
                        align: "center"
                    }
                );


            doc
                .text(
                    `Date Range: ${formatDate(start)} - ${formatDate(end)}`,
                    {
                        align: "center"
                    }
                );


            doc.moveDown(2);


            // =================================================
            // FINANCIAL SUMMARY
            // =================================================

            doc
                .fontSize(15)
                .font("Helvetica-Bold")
                .text(
                    "Financial Summary"
                );

            doc.moveDown();


            addPDFRow(
                doc,
                "Total Revenue",
                formatAmount(
                    current.totalRevenue
                )
            );


            addPDFRow(
                doc,
                "Total Expenses",
                formatAmount(
                    current.totalExpenses
                )
            );


            addPDFRow(
                doc,
                "Net Profit",
                formatAmount(
                    current.netProfit
                )
            );


            addPDFRow(
                doc,
                "Previous Net Profit",
                formatAmount(
                    previous.netProfit
                )
            );


            addPDFRow(
                doc,
                "Profit Change",
                `${percentChange}%`
            );


            doc.moveDown(2);


            // =================================================
            // REVENUE DETAILS
            // =================================================

            doc
                .fontSize(15)
                .font("Helvetica-Bold")
                .text(
                    "Revenue Details"
                );

            doc.moveDown();


            addPDFRow(
                doc,
                "Feed Bag Sales",
                formatAmount(
                    current.feedBagSales
                )
            );


            addPDFRow(
                doc,
                "Raw Material Sales",
                formatAmount(
                    current.rawMaterialSales
                )
            );


            addPDFRow(
                doc,
                "Total Revenue",
                formatAmount(
                    current.totalRevenue
                )
            );


            doc.moveDown(2);


            // =================================================
            // EXPENSE DETAILS
            // =================================================

            doc
                .fontSize(15)
                .font("Helvetica-Bold")
                .text(
                    "Expense Details"
                );

            doc.moveDown();


            addPDFRow(
                doc,
                "Purchase Cost",
                formatAmount(
                    current.purchaseCost
                )
            );


            addPDFRow(
                doc,
                "Operational Expenses",
                formatAmount(
                    current.operationalExpenses
                )
            );


            addPDFRow(
                doc,
                "Total Expenses",
                formatAmount(
                    current.totalExpenses
                )
            );


            doc.moveDown(2);


            // =================================================
            // TRANSFER DETAILS
            // =================================================

            doc
                .fontSize(15)
                .font("Helvetica-Bold")
                .text(
                    "Transfer Details"
                );

            doc.moveDown();


            addPDFRow(
                doc,
                "Transfer Count",
                current.transferCount
            );


            addPDFRow(
                doc,
                "Transfer Quantity",
                current.transferQuantity
            );


            doc.moveDown(2);


            // =================================================
            // FINAL RESULT
            // =================================================

            doc
                .fontSize(17)
                .font("Helvetica-Bold")
                .text(
                    `Net Profit: ${formatAmount(
                        current.netProfit
                    )}`,
                    {
                        align: "center"
                    }
                );


            doc.moveDown();


            doc
                .fontSize(9)
                .font("Helvetica")
                .text(
                    `Generated on: ${new Date().toLocaleString(
                        "en-IN"
                    )}`,
                    {
                        align: "center"
                    }
                );


            // ------------------------------------------------
            // END PDF
            // ------------------------------------------------

            doc.end();

        } catch (error) {

            console.error(
                "Error generating P&L PDF:",
                error
            );

            if (!res.headersSent) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to generate P&L PDF",

                    error:
                        error.message
                });
            }
        }
    }
);



module.exports = router;