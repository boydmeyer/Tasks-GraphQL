const jwt = require("jsonwebtoken");
const User = require("../../database/models/user");

module.exports.verifyUser = async (req) => {
    try {
        req.user = null;
        const bearerHeader = req.headers.authorization;
        if (bearerHeader) {
            const token = bearerHeader.split(" ")[1];
            const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const { name, email } = await User.findOne({ _id: payload.id });
            req.user = { id: payload.id, name, email };
        }
    } catch (error) {
        throw error;
    }
};
