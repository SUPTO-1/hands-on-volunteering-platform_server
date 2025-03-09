const jwt = require("jsonwebtoken");
const authenticationToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token)
    {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
    try
    {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err)
    {
        console.log("showing error in middleware: ",err);
        res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
};

module.exports = authenticationToken;