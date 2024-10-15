const express = require('express');
const bodyParser = require('body-parser');
const driver = require('bigchaindb-driver');
const base58 = require('bs58');
const crypto = require('crypto');
const { Ed25519Sha256 } = require('crypto-conditions');
const { v4: uuidv4 } = require('uuid');

const app = express();
const API_PATH = process.env.API_PATH || 'http://localhost:9984/api/v1/';
const conn = new driver.Connection(API_PATH);

app.use(bodyParser.json());

// Generate a single keypair for the user
const seed = "5fb1946608fa4da2256fd34679b558a39ac41802f22f82e4d0843df6961eb985";
const userKeypair = {
    publicKey: '3N5rFD3fXtMUBNwtHacgiLhu213oAQJkYPjarMgYLNc9',
    privateKey: '8SAcBUKK1NNzpAT23k4Q7QiY3ttBL9QwrEvJuDLQvwKK'
};

console.log('User keypair:', userKeypair);

app.post('/create-transaction', async (req, res) => {
    const assetData = {
        temperature: 29,
        datetime: new Date().toISOString(),
        uuid: uuidv4()
    };

    const metadata = {
        what: 'BigchainDB transaction'
    };

    const transaction = driver.Transaction.makeCreateTransaction(
        assetData,
        metadata,
        [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(userKeypair.publicKey))],
        userKeypair.publicKey
    );

    function signTransaction() {
        const privateKeyBuffer = Buffer.from(base58.decode(userKeypair.privateKey));
        return function sign(serializedTransaction, input, index) {
            const transactionUniqueFulfillment = input.fulfills ? serializedTransaction
                    .concat(input.fulfills.transaction_id)
                    .concat(input.fulfills.output_index) : serializedTransaction;
            const transactionHash = crypto.createHash('sha3-256').update(transactionUniqueFulfillment).digest();
            const ed25519Fulfillment = new Ed25519Sha256();
            ed25519Fulfillment.sign(transactionHash, privateKeyBuffer);
            return ed25519Fulfillment.serializeUri();
        };
    }
    const signedTransaction = driver.Transaction.delegateSignTransaction(transaction, signTransaction());

    //console.log('Signed Transaction:', JSON.stringify(signedTransaction, null, 2));

    try {
        const retrievedTx = await conn.postTransactionCommit(signedTransaction);
        if(retrievedTx?.id) {
            console.log('retrievedTx id', retrievedTx.id, 'successfully posted.');
            res.status(200).json(retrievedTx);
            return;
        }

        console.log('Transaction not posted');
        res.status(500).json({ error: 'Transaction not posted.' });
    } catch (error) {
        console.error('Error posting transaction:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});