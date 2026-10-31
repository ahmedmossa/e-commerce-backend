
import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/user.controller.js';
import {
  validate,
  updateProfileSchema,
  addAddressSchema,
  updateAddressSchema,
  addressIdParamsSchema,
} from '../validations/user.validation.js';

const router = express.Router();

router.use(protect);

router
  .route('/profile')
  .get(getProfile)
  .patch(validate(updateProfileSchema), updateProfile);

router
  .route('/addresses')
  .get(getAddresses)
  .post(validate(addAddressSchema), addAddress);

router
  .route('/addresses/:addressId')
  .patch(
    validate(addressIdParamsSchema, 'params'),
    validate(updateAddressSchema),
    updateAddress
  )
  .delete(validate(addressIdParamsSchema, 'params'), deleteAddress);

export default router;