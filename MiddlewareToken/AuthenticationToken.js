const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
const AuthenticationToken = async(req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if(!token)
        {
            console.log('No token provided');
            return res.status(401).json({
                success: false,
                message: "Authentication failed"
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        const result = await pool.query(
            "SELECT * FROM users where id = $1",
            [decoded.userId]
        );
        if(result.rows.length === 0)
        {
            console.log('User not found id:',decoded.userId);
            return res.status(401).json({
                success: false,
                message: "Authentication failed"
            });
        }
        req.user = result.rows[0];
        next();
    }
    catch(err)
    {
        console.log("Error in authentication",err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = AuthenticationToken;