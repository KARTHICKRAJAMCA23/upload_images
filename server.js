const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure the "uploads" directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Connect to MongoDB
mongoose.connect('mongodb+srv://karthi276:karth1ck@cluster0.bbxsjow.mongodb.net/imageDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define image schema
const imageSchema = new mongoose.Schema({
    name: String,
    data: Buffer,
    contentType: String
});
const Image = mongoose.model('Image', imageSchema);

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static('public'));

// Define route for the root URL
app.get('/', (req, res) => {
    res.redirect('/upload');
});

// GET method for image upload form
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// POST method for image upload
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const image = new Image({
            name: req.file.originalname,
            data: fs.readFileSync(req.file.path),
            contentType: req.file.mimetype
        });
        await image.save();
        res.redirect('/'); // Redirect to home page after upload
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// GET method to retrieve and display an image
app.get('/image/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).send('Image not found');
        }
        res.contentType(image.contentType);
        res.send(image.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
