const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const AuthenticationToken = require("../MiddlewareToken/AuthenticationToken");
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const AddEvent = async (req, res) => {
    try
    {
        const {title, description, date, time , location , category, status} = req.body;
        const createdBy = req.user.id;
        const result = await pool.query(
            `INSERT INTO events(
                title,
                description,
                date,
                time,
                location,
                category,
                created_by,
                status

            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
             [
                 title,
                 description,
                 date,
                 time,
                 location,
                 category,
                 createdBy,
                 status.toLowerCase()
             ]
        );

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event: result.rows[0]
        });
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
module.exports = AddEvent;