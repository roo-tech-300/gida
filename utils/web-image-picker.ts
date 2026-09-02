import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

type ImageAsset = {
  uri: string;
  width: number;
  height: number;
};

type PickResult = {
  canceled: boolean;
  assets: ImageAsset[];
};

function pickFromWeb(multiple: boolean): Promise<PickResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = multiple;
    input.style.display = 'none';

    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      if (files.length === 0) {
        resolve({ canceled: true, assets: [] });
        return;
      }

      const assetPromises = files.map(
        (file) =>
          new Promise<ImageAsset>((res) => {
            const reader = new FileReader();
            reader.onload = () => {
              const img = new window.Image();
              img.onload = () => {
                res({ uri: reader.result as string, width: img.width, height: img.height });
              };
              img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
          })
      );

      Promise.all(assetPromises).then((assets) => {
        resolve({ canceled: false, assets });
      });
    };

    input.oncancel = () => resolve({ canceled: true, assets: [] });
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}

export async function requestMediaLibraryPermissionsAsync() {
  if (Platform.OS === 'web') {
    return { granted: true, canAskAgain: false, status: 'granted' as const };
  }
  return ImagePicker.requestMediaLibraryPermissionsAsync();
}

export async function launchImageLibraryAsync(
  options: { mediaTypes?: string[]; allowsEditing?: boolean; aspect?: [number, number]; quality?: number; allowsMultipleSelection?: boolean } = {}
): Promise<PickResult> {
  if (Platform.OS === 'web') {
    return pickFromWeb(options.allowsMultipleSelection ?? false);
  }
  const nativeResult = await ImagePicker.launchImageLibraryAsync(options as any);
  return {
    canceled: nativeResult.canceled,
    assets: (nativeResult.assets ?? []).map((a) => ({ uri: a.uri, width: a.width, height: a.height })),
  };
}
