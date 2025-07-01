const Category = require('../../models/category_model/category_model');
const Product = require('../../models/product_model/product_model');

const filterByCategoryName = async (req, res) => {
    try {
        const { categoryName } = req.body;

        // Use regex for partial and case-insensitive match
        const category = await Category.findOne({
            categoryName: { $regex: categoryName, $options: 'i' }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const filterByProductName = async (req, res) => {
    try {
        const { productName } = req.body;

        const products = await Product.find({
            name: { $regex: productName, $options: 'i' }
        });

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found'
            });
        }

        res.status(200).json({
            success: true,
            data: products
        });

        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}


const productsFilter = async (req, res) => {
    try {
        let { price, ratings, features } = req.body;

        const filterCriteria = {};
        let sortCriteria = {};

        if (Array.isArray(price) && price.length === 2) {
            filterCriteria.basePrice = { $gte: price[0], $lte: price[1] };
        }

        if (typeof ratings === 'string' && ratings.endsWith('+')) {
            const minRating = parseFloat(ratings.replace('+', ''));
            if (!isNaN(minRating)) {
                filterCriteria.rating = { $gte: minRating };
            }
        }

        if (typeof features === 'string') {
            switch (features.toLowerCase()) {
                case 'highest rated':
                    sortCriteria.rating = -1;
                    break;
                case 'price: high to low':
                    sortCriteria.basePrice = -1;
                    break;
                case 'price: low to high':
                    sortCriteria.basePrice = 1;
                    break;
            }
        }

        console.log('Filter:', filterCriteria);
        console.log('Sort:', sortCriteria);

        const products = await Product.find(filterCriteria).sort(sortCriteria);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found'
            });
        }

        res.status(200).json({
            success: true,
            data: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};



module.exports = {
    filterByCategoryName,
    filterByProductName,
    productsFilter
};