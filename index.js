const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');

const app = express();

// Flag to track if USD rate has been fetched for this server instance
let usdRateFetched = false;

// Replace with your actual MySQL connection details
const pool = mysql.createPool({
    host: 'mysql-910d8c3f-ba85-4197-803c-871a29817e06-student3405976834-ch.h.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_R6Pnmzl4MT4lgq38FT2',
    database: 'defaultdb',
    port: 12845,
});

// Replace with your API Layer API key
const apiKey = 'PNS511uFVe2eEmhC0dM6Y6uziGxRzrWI';

// Function to save USD rate (can be called directly or within app.listen())
async function saveUsdRate() {
  try {
    if (!usdRateFetched) {
      // Get today's date
      const today = new Date().toISOString().slice(0, 10);

      // Connect to MySQL database
      const connection = await pool.getConnection();

      // **Check if table exists (optional, can be removed if table creation is ensured)**
      const [rows] = await connection.execute('SHOW TABLES LIKE \'currency\''); // Use single quotes for table name

      if (rows.length === 0) {
        // Create table if it doesn't exist
        await connection.execute(`
          CREATE TABLE currency (
            Date DATE PRIMARY KEY,
            USD_rate DECIMAL(10, 2) NOT NULL
          )
        `);
        console.log('Table currency created successfully!');
      }

      // Make API call to get USD to LKR conversion rate
      const response = await axios.get('https://api.apilayer.com/currency_data/convert?from=USD&to=LKR&amount=1', {
        headers: {
          apikey: apiKey
        }
      });

      const usdRate = response.data.result;
      console.log(`USD rate for today: ${usdRate}`);

      // Check if record for today exists (ensure proper escaping for table name)
      const [existingRecord] = await connection.execute('SELECT * FROM `currency` WHERE Date = ?', [today]);

      if (existingRecord.length === 0) {
        // Insert new record if it doesn't exist
        await connection.execute('INSERT INTO `currency` (Date, USD_rate) VALUES (?, ?)', [today, usdRate]);
        console.log(`USD rate for ${today} saved successfully!`);
      } else {
        console.log(`USD rate for ${today} already exists.`);
      }

      await connection.release();
      usdRateFetched = true; // Mark USD rate fetching as completed
      console.log('USD rate saved successfully. Exiting server...');
      process.exit(0); // Exit the process after successful save
    }
  } catch (error) {
    console.error(error);
  }
}

// Call the saveUsdRate function immediately after server starts (within app.listen() or directly)
app.listen(3000, async () => {
  console.log('Server listening on port 3000');
  await saveUsdRate(); // Call saveUsdRate to fetch and save USD rate on startup
});
