const express = require('express');
const Transaction = require('./db');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send("<h1>Hey..... S. Jahnavi</h1>");
});

// POST /api/transactions/ route
app.post('/api/transactions/', async (req, res) => {
    try {
        const { amount, transaction_type, user } = req.body;
        if (!amount || typeof amount !== 'number' || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
        if (!['DEPOSIT', 'WITHDRAWAL'].includes(transaction_type)) return res.status(400).json({ message: 'Invalid transaction type' });
        if (!user || typeof user !== 'number' || user <= 0) return res.status(400).json({ message: 'Invalid user value' });
        const transactionCount = await Transaction.countDocuments();
        const transaction_id = transactionCount + 1;
        const newTransaction = new Transaction({
            amount,
            transaction_type,
            user,
            status: 'PENDING',
            timestamp: new Date(),
            transaction_id 
        });
        const savedTransaction = await newTransaction.save();
        res.status(201).json({
            transaction_id: savedTransaction.transaction_id,
            amount: parseFloat(savedTransaction.amount.toString()),
            transaction_type: savedTransaction.transaction_type,
            status: savedTransaction.status,
            user: savedTransaction.user,
            timestamp: savedTransaction.timestamp.toISOString()
        });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating transaction', error: error.message });
    }
});

// GET /api/transactions/
app.get('/api/transactions/', async (req, res) => {
    try {
        const userId = parseInt(req.query.user_id);
        if (!userId) return res.status(400).json({ message: 'user_id query parameter is required' });
        const transactions = await Transaction.find({ user: userId });
        const formattedTransactions = transactions.map(transaction => ({
            transaction_id: transaction.transaction_id,
            amount: parseFloat(transaction.amount.toString()),
            transaction_type: transaction.transaction_type,
            status: transaction.status,
            timestamp: transaction.timestamp.toISOString()
        }));

        res.status(200).json({ transactions: formattedTransactions });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching transactions', error: error.message });
    }
});

// PUT request to update the status of a transaction by transaction_id
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const transactionId = parseInt(req.params.id);
        const { status } = req.body;
        if (!status || !['PENDING', 'COMPLETED', 'FAILED'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const transaction = await Transaction.findOne({ transaction_id: transactionId });
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        transaction.status = status;
        await transaction.save();
        res.json({
            transaction_id: transaction.transaction_id,
            amount: parseFloat(transaction.amount.toString()),
            transaction_type: transaction.transaction_type,
            status: transaction.status,
            timestamp: transaction.timestamp.toISOString(),
        });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET request to fetch a transaction by transaction_id
app.get('/api/transactions/:id', async (req, res) => {
    try {
        const transactionId = parseInt(req.params.id);
        const transaction = await Transaction.findOne({ transaction_id: transactionId });
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        const amount = transaction.amount.toString();
        const formattedAmount = parseFloat(amount).toFixed(2);
        res.json({
            transaction_id: transaction.transaction_id,
            amount: formattedAmount,  
            transaction_type: transaction.transaction_type,
            status: transaction.status,
            timestamp: transaction.timestamp.toISOString(), 
        });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(3000, () => {
    console.log(`http://localhost:3000/`);
});
