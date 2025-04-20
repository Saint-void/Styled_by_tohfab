const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();

// ✅ Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://Efe:Donaldefe1.@void.jrk6kbe.mongodb.net/fashion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Product Schema & Model
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ Routes

// Upload form page
app.get('/upload', (req, res) => {
  res.render('upload');
});

// Handle image + product upload
app.post('/upload-product', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, isNew } = req.body;
    const imageUrl = '/uploads/' + req.file.filename;

    const newProduct = new Product({
      name,
      description,
      price,
      imageUrl,
      isNew: isNew === 'on'
    });

    await newProduct.save();
    res.redirect('/collections');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading product');
  }
});

// ✅ Show all products with pagination (NEWEST first)
app.get('/collections', async (req, res) => {
  try {
    const perPage = 6;
    const page = parseInt(req.query.page) || 1;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    const products = await Product.find()
      .sort({ _id: -1 }) // 👈 Show newest uploads first
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

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
