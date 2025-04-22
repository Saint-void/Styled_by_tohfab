const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Efe:Donaldefe1.@void.jrk6kbe.mongodb.net/fashion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'styled-by-tohfab',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});
const upload = multer({ storage });

// ✅ Mongoose Model
const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
  isNew: Boolean,
});
const Product = mongoose.model('Product', ProductSchema, 'Product');

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Routes

// Upload form page
app.get('/upload', (req, res) => {
  res.render('upload');
});

// Handle product + image upload
app.post('/upload-product', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, isNew } = req.body;

    const newProduct = new Product({
      name,
      description,
      price,
      imageUrl: req.file.path, // Cloudinary returns a URL
      isNew: isNew === 'on'
    });

    await newProduct.save();
    res.redirect('/collections');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading product');
  }
});

// Products page with pagination
app.get('/collections', async (req, res) => {
  try {
    const perPage = 6;
    const page = parseInt(req.query.page) || 1;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    const products = await Product.find()
      .sort({ _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render('collections', {
      products,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Redirect root to /collections
app.get('/', (req, res) => {
  res.redirect('/collections');
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
