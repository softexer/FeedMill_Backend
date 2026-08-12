


const ExpenseModel = require('../../app/Models/expenses.js');

const addPurchasedStock = async (req, res) => {
    // Add Expense
    try {


        if (!req.body || !req.body.expensesData) {
            console.log("daeme", req.body.expensesData)
            return res.status(400).json({
                message: "expensesData is missing in request"
            });
        }

        let params;
        try {
            params = JSON.parse(req.body.expensesData);
        } catch (err) {
            return res.status(400).json({
                message: "expensesData must be valid JSON string"
            });
        }
        const {
            stockPointName,
            expenseCategory,
            amount,
            expenseDate,
            description,
            attachment
        } = params;

        // Validation
        if (!stockPointName || !expenseCategory || !amount || !expenseDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (amount <= 0) {
            return res.status(200).json({
                response: 0,
                message: 'Amount must be greater than 0'
            });
        }
        var   filedbpath = ""
        if (req.files && req.files.image) {
            const file = req.files.image;
            const imageid = "exp@" + idb.GenerateIDS(9);
            const filename = imageid + file.name;
            const filemvpath = `./public/images/expenses/${filename}`;
            const filedbpath = `/images/expenses/${filename}`;

            // MOVE FILE (PROMISE SAFE)
            await new Promise((resolve, reject) => {
                file.mv(filemvpath, err => err ? reject(err) : resolve());
            });

        }

        // TODO: Save to database
        const expense = await ExpenseModel.create({
            stockPointName,
            expenseCategory,
            amount,
            expenseDate,
            description,
            attachment:filedbpath,
        });

        res.status(200).json({
            response: 3,
            message: 'Expense added successfully',
            data: {
                stockPointName,
                expenseCategory,
                amount,
                expenseDate,
                description,
                filedbpath

            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding expense',
            error: error.message
        });
    }
};

module.exports = { addPurchasedStock };