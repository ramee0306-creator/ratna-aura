// Taking or choosing a palm photo, shrunk to a size that reads well and uploads quickly.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type TakenPhoto = { uri: string; base64: string };

/** Longest side of the photo sent for reading (enough to see the palm lines clearly). */
const MAX_SIDE = 1280;

async function shrink(asset: ImagePicker.ImagePickerAsset): Promise<TakenPhoto> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG, base64: true });
  return { uri: saved.uri, base64: saved.base64 ?? '' };
}

/** Opens the camera (or the photo picker). Resolves null if cancelled, 'denied' without camera permission. */
export async function getPalmPhoto(source: 'camera' | 'gallery'): Promise<TakenPhoto | null | 'denied'> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return 'denied';
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  return shrink(result.assets[0]);
}
