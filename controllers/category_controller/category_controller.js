const Category = require('../../models/category_model/category_model');

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