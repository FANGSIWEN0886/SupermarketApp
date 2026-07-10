const express = require('express');
const mysql = require('mysql2');
const multer = require('multer')
const app = express();

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RP738964$',
    database: 'c237_supermarketapp'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

//Middleware to parse incoming request bodies
app.use(express.urlencoded({
    extended: false
}));

// enable static files
app.use(express.static('public'));

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

// Define routes
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM products';
    // Fetch data from MySQL
    connection.query( sql , (error, results) => {
    if (error) {
        console.error('Database query error:', error.message);
        return res.send('Error Retrieving products');
    }
    // Render HTML page with data
    //products is the key used in ejs file, while results stands for the raw data. 
    res.render('index', { products: results });
    });
});

//Retrieve one product with its ID
app.get('/product/:ID', (req, res) => {
    // Extract the product ID from the request parameters
    const productId = req.params.ID;
    const sql = 'SELECT * FROM products WHERE productId = ?';
    // Fetch data from MySQL based on the product ID
    connection.query( sql , [productId], (error, results) => {
        //Catching DB issues.
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error Retrieving product by ID');
        }
        // Check if any product with the given ID was found(product side):
        if (results.length > 0) {
            // Render HTML page with the product data
            res.render('product', { product: results[0] });
        } else {
            // If no product with the given ID was found
            res.send('Product not found');
        }
    });
});

// Route to display the form for adding a new product
app.get('/addProduct', (req, res) => {
    res.render('addProduct');
});
// Route to handle the form submission for adding a new product
app.post('/addProduct', upload.single('image'), (req, res) => {
    // Extract product data from the request body
    const { name, quantity, price} = req.body;
    
    //How to extract the file/image name in form
    let image;
    if (req.file) {
        // currently we only save the filename of the file
        image = req.file.filename;
    } else {
        image = null;
    };

    const sql = 'INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)';
    // Insert the new product into the database
    connection.query( sql , [name, quantity, price, image], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error adding product:", error);
            // Show error message to client side webpage.
            res.send('Error adding product');
        } else {
            // Send a success response
            // Using redirect instead of render
            res.redirect('/');
        }
    });
});

// Route to display the form for editing a product
app.get('/editProduct/:ID', (req, res) =>{
    const productId = req.params.ID;
    const sql = "SELECT * FROM products WHERE productId = ?";
    //Fetch data from Mysql based on the product ID
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.send("Error retrieving poduct by ID");
        };
        //Check if any product with the given ID was found 
        //Checking part will be done in the get request
        if (results.length > 0){
            //Render HTML page with the product data
            res.render("editProduct", {product:results[0]});
        } else {
            res.send("Product not found");
        };
    });
});

// Route to handle the form submission for editing a product
app.post('/editProduct/:ID', upload.single('image'), (req, res) => {
    const productId = req.params.ID;
    const {name, quantity, price} = req.body;
    
    //Enable extraction of image from the form
    let image = req.body.currentImage; //Retrieve current image filename
    if (req.file) { //If new image is uploaded
        image = req.file.filename; //Set image to be new image filename
    } else {
        image = null
    };

    const sql = "UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE productId = ?";

    //Edit the existing product in DB
    //Remember to follow the sequency of attributes in sql query
    connection.query(sql, [name, quantity, price, image, productId], (error, results) => {
        if (error) {
            //Handle any error that occurs during the database operation
            console.error("Error updating product:", error);
            res.send("Error updating product");
        } else {
            //Back to the main page for verifying the changes
            res.redirect('/');
        };
    });
});

// Route to handle the deletion of a product
app.get('/deleteProduct/:ID', (req, res) =>{
    const productId = req.params.ID;
    const sql = "DELETE FROM products WHERE productId = ?";
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error("Error deleting product:", error);
            res.send("Error deleting product");
        } else {
            res.redirect('/');
        };
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));