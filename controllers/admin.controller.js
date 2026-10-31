
import User from '../models/User.model.js';

export const getAllUsers = async (req, res, next) => {
  try {
    
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching users',
    });
  }
};