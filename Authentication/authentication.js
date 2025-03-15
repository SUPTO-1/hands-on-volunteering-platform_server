const jwt = require("jsonwebtoken");
require("dotenv").config(); 
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const { json } = require("express");
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const signup = async (req, res) => {
    const { name, email, password, skills, causes } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password,10);
        const result = await pool.query(
            "INSERT INTO users (name, email, hashedpassword, skills, causes) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email",
            [name, email, hashedPassword, skills, causes]
        );
        const newUser = result.rows[0];
        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error creating user" });
    }
};
const login = async (req,res)=>{
    const {email,password} = req.body;
    try{
        const result = await pool.query(
            "SELECT * FROM users where email = $1",
            [email]
        );
        if(result.rows.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password,user.hashedpassword);
        if(isMatch)
        {
            //creating token here
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
            const { hashedpassword, ...userWithoutPassword } = user;
            res.status(200).json({
                success: true,
                message: "User logged in successfully",
                user: userWithoutPassword,
                token
            });
        }
        else
        {
            res.status(401).json({
                success: false,
                message: "Incorrect or Password is incorrect"
            });
        }

    }
    catch(err)
    {
        console.log("Showing error in login",err);
        res.status(500).json({
            success: false,
            message: "There is some error in login"
        });
    }
}
module.exports = { signup , login };