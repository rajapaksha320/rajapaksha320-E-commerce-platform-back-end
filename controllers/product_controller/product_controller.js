const Product = require('../../models/product_model/product_model');
const ProductImage = require('../../models/product_model/product_image_model');
const ProductVariant = require('../../models/product_model/product_varient_model');
const ProductVariantAttributes = require('../../models/product_model/product_varient_attributes_model');


exports.createNewProduct = async (req, res) => {
    try {
        const session = await Product.startSession();
        session.startTransaction();

        // console.log('Creating new product with data:', req.body);

        if (req.body.role !== 'seller') {
            return res.status(403).json({ success: false, message: 'Unauthorized action. Only sellers can create products.' });
        }

        const {
            name,
            description,
            basePrice,
            stock,
            heroImage,
            rating,
            totalReviews,
            age,
            storeId,
            categoryId,
            discountId,
            images,
            variants,
        } = req.body;

        const newProduct = await Product.create([{
            name,
            description,
            basePrice,
            stock,
            heroImage,
            rating,
            totalReviews,
            age,
            storeId,
            categoryId,
            discountId,
            createdAt: new Date(),
        }], { session });

        const product = newProduct[0];

        if (Array.isArray(images) && images.length > 0) {
            const imageDocs = images.map(img => ({
                productId: product._id,
                imageUrl: img.imageUrl,
                isHero: img.isHero || false,
            }));
            await ProductImage.insertMany(imageDocs, { session });
        }

        if (Array.isArray(variants) && variants.length > 0) {
            for (const variant of variants) {
                const variantDoc = await ProductVariant.create([{
                    productId: product._id,
                    stock: variant.stock,
                    variantPrice: variant.variantPrice,
                    stockKeepingUnit: variant.stockKeepingUnit,
                    createdAt: new Date(),
                }], { session });

                const variantId = variantDoc[0]._id;

                if (Array.isArray(variant.attributes)) {
                    const attributesDocs = variant.attributes.map(attr => ({
                        variantId,
                        attributeName: attr.attributeName,
                        attributeValue: attr.attributeValue,
                    }));
                    await ProductVariantAttributes.insertMany(attributesDocs, { session });
                }
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product,
        });

    } catch (error) {
        console.log('Error creating product:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}


exports.getAllProductByStoreId = async (req, res) => {
    try {
        const { storeId } = req.params;

        if (!storeId) {
            return res.status(400).json({ success: false, message: 'Store ID is required' });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(storeId)) {
            return res.status(400).json({ success: false, message: 'Invalid Store ID format' });
        }

        const products = await Product.find({ storeId }).populate([
            { path: 'categoryId', select: 'name' },
            { path: 'images', model: 'ProductImage' }, // <-- this is the correct way
            { path: 'variants', model: 'ProductVariant' } // optional: only if needed
        ]);

        if (!products || products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found for this store' });
        }

        res.status(200).json({
            success: true,
            message: 'Products fetched successfully',
            data: products,
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
