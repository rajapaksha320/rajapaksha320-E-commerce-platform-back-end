const Store = require('../../models/store_model/store_model');

exports.createStoreController = async (req, res) => {
    try {
        console.log(req.body);
        const {
  storeName,
  storeDescription,
  storeLocation,
  storeLogo,
  bannerImage,
  totalSales = 0,
  categoryId,
  storePolicies,
  totalProducts = 0,
  socialMediaLinks = [],
  status = 'active',
  rating = 0,
  role,
  userId,    
  tenantId    
} = req.body;

//  if( !storeName || !categoryId || !userId || !tenantId) {
//     return res.status(400).json({ message: 'Store name, category ID, user ID and tenant ID are required.' });
//   }

 if(role != 'seller') {
    return res.status(403).json({ message: 'Unauthorized action. Only sellers can create stores.' });
  }

//   console.log(req.body.tenantId);
  

const newStore = new Store({
  storeName,
  storeDescription,
  storeLocation,
  storeLogo,
  bannerImage,
  totalSales,
  sellerId:userId,
  categoryId,
  storePolicies,
  totalProducts,
  socialMediaLinks,
  status,
  rating,
  tenantId:tenantId,  
});
 
        const store = await newStore.save();
        if (!store) {
            return res.status(500).json({ message: 'Store creation failed' });
        }
        res.status(201).json({
            message: 'Store created successfully',
            data: store,
            success: true
        });

    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// const getStoreController = async (req, res) => {
//     try {
//         console.log(req.params);
        
//     } catch (error) {
//         console.error('Error fetching store:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// }

// const updateStoreController = async (req, res) => {
//     try {
//         console.log(req.params);
//         console.log(req.body);
        
//     } catch (error) {
//         console.error('Error updating store:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// }


// const deleteStoreController = async (req, res) => {
//     try {
//         console.log(req.params);
        
//     } catch (error) {
//         console.error('Error deleting store:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// }

