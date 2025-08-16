const Category = require('../../models/category_model/category_model');
const ListingModel = require('../../models/listing_model/listing_model');


exports.createNewCategory = async (req, res) => {
  try {
    const { tenantId, categoryName, description, parentCategoryId, numberOfProducts } = req.body;

    const newCategory = await Category.create({
      tenantId,
      categoryName,
      description,
      parentCategoryId,
      numberOfProducts,
    });

    res.status(201).send({
      success: true,
      message: 'Category created successfully',
      data: newCategory,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error occurred while creating category',
    });
  }
};


exports.getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find();

    res.status(200).send({
      success: true,
      message: 'Categories fetched successfully',
      data: categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error occurred while fetching categories',
    });
  }
};



// new update
exports.mainFilterController = async (req, res) => {
  try {
    const {
      categoryMain,
      PriceRange,
      CustomerRating,
      color,
      brandName,
    } = req.body;

    const {page = 1, pageSize = 10} = req.query

    console.log(categoryMain, PriceRange, CustomerRating, color, brandName);


    const andConditions = [];

    // Category filter
    if (categoryMain) {
      andConditions.push({ 'category.main': categoryMain });
    }

    if (color) {
      const colors = Array.isArray(color) ? color : [color];
      andConditions.push({ 'variations.color': { $in: colors } });
    }

    // Price filter (only variations.price)
    if (PriceRange) {
      const [min, max] = PriceRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        andConditions.push({
          $expr: {
            $and: [
              { $gte: [{ $toDouble: { $arrayElemAt: ["$variations.price", 0] } }, min] },
              { $lte: [{ $toDouble: { $arrayElemAt: ["$variations.price", 0] } }, max] }
            ]
          }
        });
      }
    }

    // Customer rating filter
    if (CustomerRating) {
      andConditions.push({ averageRating: { $gte: Number(CustomerRating) } });
    }

    // Brand filter
    if (brandName) {
      andConditions.push({ brand: brandName });
    }

    // Build final filter
    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    // Pagination
    const pageNumber = parseInt(page, 10);
    const size = parseInt(pageSize, 10);
    const skip = (pageNumber - 1) * size;

    const totalListings = await ListingModel.countDocuments(filter);
    const listings = await ListingModel.find(filter)
      .skip(skip)
      .limit(size)
      .lean();

    res.status(200).json({
      success: true,
      message: 'Filtered listings fetched successfully.',
      pagination: {
        totalItems: totalListings,
        currentPage: pageNumber,
        pageSize: size,
        totalPages: Math.ceil(totalListings / size),
      },
      data: listings,
    });

  } catch (error) {
    console.error('Error in mainFilterController:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

