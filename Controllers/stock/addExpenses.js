


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
            stockPoint,
            expenseCategory,
            amount,
            expenseDate,
            description,
            attachment
        } = params;

        // Validation
        if (!stockPoint || !expenseCategory || !amount || !expenseDate) {
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

        // TODO: Save to database
        const expense = await ExpenseModel.create({
          stockPoint,
          expenseCategory,
          amount,
          expenseDate,
          description,
          attachment,
        });

        res.status(200).json({
              response: 3,
            message: 'Expense added successfully',
            data: {
                stockPoint,
                expenseCategory,
                amount,
                expenseDate,
                description,
                attachment

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