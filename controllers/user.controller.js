
import User from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const MAX_ADDRESSES = 10;

const getUserId = (req) => req.user._id ?? req.user.id;

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  isVerified: user.isVerified,
  addresses: user.addresses,
  createdAt: user.createdAt,
});

// ───────────────────────── Profile ─────────────────────────

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(getUserId(req));
  if (!user) throw new ApiError('User not found', 404);

  res.status(200).json({ success: true, data: sanitizeUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    getUserId(req),
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!user) throw new ApiError('User not found', 404);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: sanitizeUser(user),
  });
});

// ───────────────────────── Address Book ─────────────────────────

export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(getUserId(req)).select('addresses');
  if (!user) throw new ApiError('User not found', 404);

  res.status(200).json({
    success: true,
    results: user.addresses.length,
    data: user.addresses,
  });
});

export const addAddress = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const user = await User.findById(userId).select('addresses');
  if (!user) throw new ApiError('User not found', 404);

  if (user.addresses.length >= MAX_ADDRESSES) {
    throw new ApiError(`You can save up to ${MAX_ADDRESSES} addresses only`, 400);
  }

  // أول عنوان يصبح افتراضياً تلقائياً
  const makeDefault = req.body.isDefault === true || user.addresses.length === 0;

  if (makeDefault) {
    await User.updateOne({ _id: userId }, { $set: { 'addresses.$[].isDefault': false } });
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $push: { addresses: { ...req.body, isDefault: makeDefault } } },
    { new: true, runValidators: true }
  ).select('addresses');

  const created = updated.addresses[updated.addresses.length - 1];

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: created,
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { addressId } = req.params;

  const user = await User.findById(userId).select('addresses');
  if (!user) throw new ApiError('User not found', 404);
  if (!user.addresses.id(addressId)) throw new ApiError('Address not found', 404);

  if (req.body.isDefault === true) {
    await User.updateOne({ _id: userId }, { $set: { 'addresses.$[].isDefault': false } });
  }

  const updates = {};
  for (const [key, value] of Object.entries(req.body)) {
    updates[`addresses.$.${key}`] = value;
  }

  const updated = await User.findOneAndUpdate(
    { _id: userId, 'addresses._id': addressId },
    { $set: updates },
    { new: true, runValidators: true }
  ).select('addresses');

  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: updated.addresses.id(addressId),
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { addressId } = req.params;

  const user = await User.findById(userId).select('addresses');
  if (!user) throw new ApiError('User not found', 404);
  if (!user.addresses.id(addressId)) throw new ApiError('Address not found', 404);

  const updated = await User.findByIdAndUpdate(
    userId,
    { $pull: { addresses: { _id: addressId } } },
    { new: true }
  ).select('addresses');

  const hasDefault = updated.addresses.some((a) => a.isDefault);
  if (updated.addresses.length > 0 && !hasDefault) {
    await User.updateOne({ _id: userId }, { $set: { 'addresses.0.isDefault': true } });
  }

  res.status(200).json({ success: true, message: 'Address deleted successfully' });
});