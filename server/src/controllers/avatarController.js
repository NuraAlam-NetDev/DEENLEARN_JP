import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadFile, deleteAssets } from '../services/media.js';

// PUT /api/auth/me/avatar  (multipart, field "file": a picture, JPG / PNG / WebP / GIF, up to 5 MB)
export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+avatarPublicId');
  const file = await uploadFile(req.file, { folder: 'deenlearn/avatars', allow: ['image'] });

  const oldId = user.avatarPublicId;
  user.avatar = file.url;
  user.avatarPublicId = file.publicId;
  await user.save();
  if (oldId) await deleteAssets([{ publicId: oldId, resourceType: 'image' }]);

  res.json({ user: await User.findById(user._id).lean() });
});

// DELETE /api/auth/me/avatar  -> back to the initial letter
export const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+avatarPublicId');
  const oldId = user.avatarPublicId;
  user.avatar = '';
  user.avatarPublicId = '';
  await user.save();
  if (oldId) await deleteAssets([{ publicId: oldId, resourceType: 'image' }]);
  res.json({ user: await User.findById(user._id).lean() });
});
