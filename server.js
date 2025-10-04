const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/productsDB')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Variant Schema (nested document)
const variantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  size: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  sku: { type: String, required: true, unique: true },
  price_adjustment: { type: Number, default: 0 }
}, { _id: true });

// Product Schema and Model with nested variants
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  base_price: { type: Number, required: true, min: 0 },
  category: { 
    type: String, 
    required: true,
    enum: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports']
  },
  brand: { type: String, required: true },
  variants: [variantSchema],
  tags: [String],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Routes

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'E-commerce Catalog API with Nested Documents' });
});

// Create a new product
app.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Filter products by category
app.get('/products/category/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Project specific variant details
app.get('/products/variants/details', async (req, res) => {
  try {
    const products = await Product.find({}, {
      name: 1,
      category: 1,
      'variants.color': 1,
      'variants.size': 1,
      'variants.stock': 1,
      'variants.sku': 1
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find products with specific variant color
app.get('/products/variants/color/:color', async (req, res) => {
  try {
    const products = await Product.find({ 'variants.color': req.params.color });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
app.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update variant stock by SKU
app.patch('/products/variants/:sku/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    const result = await Product.updateOne(
      { 'variants.sku': req.params.sku },
      { $set: { 'variants.$.stock': stock } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    res.json({ message: 'Variant stock updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add variant to product
app.post('/products/:id/variants', async (req, res) => {
  try {
    const result = await Product.updateOne(
      { _id: req.params.id },
      { $push: { variants: req.body } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(201).json({ message: 'Variant added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product
app.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove variant by SKU
app.delete('/products/variants/:sku', async (req, res) => {
  try {
    const result = await Product.updateOne(
      { 'variants.sku': req.params.sku },
      { $pull: { variants: { sku: req.params.sku } } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
