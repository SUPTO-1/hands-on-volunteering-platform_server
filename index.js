require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const port = process.env.PORT || 5000;
const app = express();
const { signup, login } = require("./Authentication/authentication");
const authenticationToken = require("./Authentication Middleware/authenticationToken");
app.use(express.json());
app.use(cors());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
pool.connect()
    .then(() => {
        console.log("Database connected");
    })
    .catch((error) => {
        console.log("Database connection error:", error);
    });


app.post('/signup', signup);
app.post('/login', login);
app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
