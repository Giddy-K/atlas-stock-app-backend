const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

//create product
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  //Validaton
  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all the fields");
  }

  //Handle Image upload
  let fileData = {};
  if (req.file) {
    //Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Atlas App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded!");
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create Product
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });
  console.log(product);
  res.status(201).json(product);
});

// Get all products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(products);
});

//Get single product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  //If product does not exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found!");
  }
  //Match the product to the user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized!");
  }
  res.status(200).json(product);
});

//Delete product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  //If product does not exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found!");
  }
  //Match the product to the user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized to delete this product!");
  }
  await product.remove();
  res.status(200).json({ message: "Product deleted!" });
});

//Update product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;
  const product = await Product.findById(id);

  //If product does not exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found!");
  }
  //Match the product to the user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized to update this product!");
  }

  //Handle Image upload
  let fileData = {};
  if (req.file) {
    //Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Atlas App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded!");
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update Product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      //run validators
      new: true,
      runValidators: true,
    }
  );
  console.log(updatedProduct);
  res.status(201).json(updatedProduct);
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
