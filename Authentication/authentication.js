require("dotenv").config(); 
const { Pool } = require("pg");
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
console.log("Database Password in signup:", process.env.DB_PASSWORD);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);

const signup = async (req, res) => {
    const { name, email, password, skills, causes } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO users (name, email, password, skills, causes) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email",
            [name, email, password, skills, causes]
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
        if(password === user.password)
        {
            res.status(200).json({
                success: true,
                message: "Login successful",
                user,
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
