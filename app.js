const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

console.log("🔄 Starting E-commerce Catalog Server...");

// =============================
// MongoDB Connection
// =============================
const MONGODB_URI = "mongodb://localhost:27017/ecommerce";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.log("❌ MongoDB connection failed:", err.message));

// =============================
// Product Schema with Nested Variants
// =============================
const VariantSchema = new mongoose.Schema({
  color: String,
  size: String,
  stock: { type: Number, default: 0 }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  variants: [VariantSchema]
}, { timestamps: true });

const Product = mongoose.model("Product", ProductSchema);

// =============================
// Sample Products Data
// =============================
const sampleProducts = [
  {
    name: "T-Shirt",
    price: 25,
    category: "Clothing",
    variants: [
      { color: "Red", size: "M", stock: 10 },
      { color: "Blue", size: "L", stock: 5 }
    ]
  },
  {
    name: "Laptop",
    price: 1200,
    category: "Electronics",
    variants: [
      { color: "Silver", size: "15-inch", stock: 7 },
      { color: "Black", size: "13-inch", stock: 3 }
    ]
  },
  {
    name: "Sneakers",
    price: 80,
    category: "Footwear",
    variants: [
      { color: "White", size: "42", stock: 15 },
      { color: "Black", size: "40", stock: 8 }
    ]
  }
];

// =============================
// CRUD Routes
// =============================

// GET ALL PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products.length ? products : sampleProducts);
  } catch (err) {
    res.json(sampleProducts);
  }
});

// GET PRODUCTS BY CATEGORY
app.get("/products/category/:category", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products.length ? products : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ONLY VARIANT DETAILS
app.get("/products/:id/variants", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("variants");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product.variants);
  } catch (err) {
    res.status(400).json({ error: "Invalid product ID" });
  }
});

// CREATE NEW PRODUCT
app.post("/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE PRODUCT
app.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE PRODUCT
app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Root Route - API Info
// =============================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 E-commerce Catalog API is running!",
    endpoints: {
      "GET /products": "Get all products",
      "GET /products/category/:category": "Get products by category",
      "GET /products/:id/variants": "Get variants of a product",
      "POST /products": "Create a new product",
      "PUT /products/:id": "Update a product",
      "DELETE /products/:id": "Delete a product"
    },
    samplePayload: {
      createProduct: {
        name: "Product Name",
        price: 50,
        category: "Electronics",
        variants: [
          { color: "Red", size: "M", stock: 10 }
        ]
      }
    }
  });
});

// =============================
// Start Server
// =============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ E-commerce Catalog Server started on port ${PORT}`);
  console.log(`🚀 Open http://localhost:${PORT} to test the API`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`🔄 Port ${PORT} is busy, trying 3001...`);
    app.listen(3001, () => console.log(`✅ Server started on port 3001`));
  }
});
