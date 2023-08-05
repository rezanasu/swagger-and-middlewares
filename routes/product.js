const express = require("express");
const router = express.Router();
const pool = require("../config/config.js");
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const {authorization} = require("../middlewares/auth.js")

router.get("/", async (req, res, next) => {
    try {
        let {page, limit} = req.query

        const findQuery = `
            SELECT
                *
            FROM products
                LIMIT $1 OFFSET $2
        `

        page = +page || DEFAULT_PAGE;
        limit = +limit || DEFAULT_LIMIT;
        let offset = (page - 1) * limit;

        const result = await pool.query(findQuery, [limit, offset]);

        const countQuery = `
            SELECT
                COUNT(*)
            FROM products
        `
        let totalData = await pool.query(countQuery)
        totalData = +totalData.rows[0].count
    
        let totalPages = Math.ceil(totalData / limit);
        
        let next = page < totalPages ? (page + 1) : null
        let previous = page > 1 ? (page - 1) : null

        res.status(200).json({
            data: result.rows,
            totalPages,
            totalData,
            currentPage: page,
            next,
            previous
        })
    
    } catch(err) {
        next(err)
    }
})

router.get("/:id", async (req, res, next) => {

    try {

        const {id} = req.params;

        const findQuery = `
            SELECT
                products.id AS id,
                products.title AS title,
                products.sku AS sku,
                products.quantity AS quantity,
                products.created_at AS created_at,
                products.updated_at AS updated_at,
                ARRAY_AGG(categories.title) AS categories
            FROM products
                INNER JOIN product_categories AS pc
                    ON pc.product_id = products.id
                INNER JOIN categories
                    ON pc.category_id = categories.id
            WHERE products.id = $1
            GROUP BY products.id
        `

        const result = await pool.query(findQuery, [id])

        if(result.rows.length === 0) {
            throw {name: "ErrorNotFound"}
        } else {
            res.status(200).json(result.rows[0])
        }

    } catch(err) {
        next(err);
    }
})


// Role Admin only

// INSERT
router.post("/", authorization, async (req, res, next) => {
    try {
        const {title, sku, quantity, category_ids} = req.body;
        

        const insertQuery = `
            INSERT INTO products(title, sku, quantity)
                VALUES
                    ($1, $2, $3)
            RETURNING *
        `
        // INSERT PRODUCT
        const result = await pool.query(insertQuery, [title, sku, quantity]);

        

        const createdProduct = result.rows[0];
        // INSERT RELATION WITH CATEGORIES
        let insertCategories = `
            INSERT INTO product_categories(product_id, category_id)
                VALUES

        `

        let appendCategories = ''
        for(let i = 0; i < category_ids.length; i++) {
            const currentID = category_ids[i]
            let currentStr = '';

            if(i === category_ids.length - 1) {
                currentStr += `(${createdProduct.id}, ${currentID})`
            } else {
                currentStr += `(${createdProduct.id}, ${currentID}),`
            }
            appendCategories += currentStr
        }

        insertCategories += appendCategories;

        const categoryResult = await pool.query(insertCategories)

        res.status(201).json({message: "Product created succesfully"})

    } catch(err) {
        next(err);
    }

})

// Update product

router.put("/:id", authorization, async (req, res, next) => {
    try {
        const {quantity} = req.body;
        const {id} = req.params;

        const updateQuery = `
            UPDATE products
                SET quantity = $1,
                    updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `

        const result = await pool.query(updateQuery, [quantity, id])
       
        if(result.rows.length === 0) {
            throw {name: "ErrorNotFound"}
        } else {
            res.status(200).json({message: "Data updated successfully"})
        }
    } catch(err) {
        next(err);
    }
})


// Delete Product

router.delete("/:id", authorization, async (req, res, next) => {

    try {
        const {id} = req.params;

        const deleteQuery = `
            DELETE FROM products
            WHERE id = $1
            RETURNING *
        `

        const result = await pool.query(deleteQuery, [id]);

        if(result.rows.length === 0) {
            throw {name: "ErrorNotFound"}
        } else {
            res.status(200).json({message: "Data deleted successfully"})
        }
    } catch(err) {
        next(err);
    }
})

module.exports = router;