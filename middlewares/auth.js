const {verifyToken} = require("../lib/jwt.js")
const pool = require("../config/config.js")

const authentication = async (req, res, next) => {

    try {
       
        if(!req.headers.authorization) {
            throw {name: "Unauthenticated"}
        } 
        const accessToken = req.headers.authorization.split(" ")[1];

        // decode token
        const {id, email, role} = verifyToken(accessToken);
        
        const findQuery = `
            SELECT
                *
            FROM users
                WHERE email = $1 AND
                      id = $2
        `

        const result = await pool.query(findQuery, [email, id]);

        if(result.rows.length === 0) {
            throw {name: "Unauthenticated"}
        } else {

            // Terautentikasi
            const foundUser = result.rows[0]
            // Custom property loggedUser
            req.loggedUser = {
                id: foundUser.id,
                email: foundUser.email,
                role: foundUser.role
            }   

            // Lanjut ke middleware selanjutnya
            next();
        }
    } catch(err) {
        next(err);
    }
}

const authorization = (req, res, next) => {

    // Execute Setelah authentication
    try {

        const {role} = req.loggedUser;
        
        if(role === "admin") {
            next();
        } else {
            throw {name: "Unauthorized"}
        }
    } catch(err) {
        next(err);
    }
}

module.exports = {
    authentication,
    authorization
}