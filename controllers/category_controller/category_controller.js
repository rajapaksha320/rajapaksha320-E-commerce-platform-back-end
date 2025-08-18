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
      title
    } = req.body;

    const { page = 1, pageSize = 10, sellerId } = req.query;

    const andConditions = [];

    // Optional sellerId filter
    if (sellerId) {
      andConditions.push({ sellerDetails: sellerId });
    }

    // Category filter
    if (categoryMain) {
      andConditions.push({ 'category.main': categoryMain });
    }

    // Color filter
    if (color) {
      const colors = Array.isArray(color) ? color : [color];
      andConditions.push({ 'variations.color': { $in: colors } });
    }

    // Price filter (check all variations)
    if (PriceRange) {
      const [min, max] = PriceRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        andConditions.push({
          $expr: {
            $anyElementTrue: {
              $map: {
                input: '$variations',
                as: 'v',
                in: {
                  $and: [
                    { $gte: [{ $toDouble: '$$v.price' }, min] },
                    { $lte: [{ $toDouble: '$$v.price' }, max] }
                  ]
                }
              }
            }
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

    if (title) {
      andConditions.push({
        title: { $regex: title, $options: 'i' }
      });
    }

    // Build final filter
    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const pageNumber = parseInt(page, 10);
    const size = parseInt(pageSize, 10);
    const skip = (pageNumber - 1) * size;

    // Total listings
    const totalListings = await ListingModel.countDocuments(filter);

    // Fetch filtered listings
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


