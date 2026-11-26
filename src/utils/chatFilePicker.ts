import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { isProbablyBinaryText } from './whatsappParser';

const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB cap keeps parsing instant and avoids memory spikes.

export type PickChatFileResult =
  | { status: 'canceled' }
  | { status: 'success'; fileName: string; content: string; sizeBytes?: number }
  | { status: 'error'; message: string };

function isSupportedTextAsset(name: string, mimeType?: string): boolean {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.txt')) {
    return true;
  }
  if (mimeType && mimeType.startsWith('text/')) {
    return true;
  }
  return false;
}

/**
 * Opens the system document picker to import an exported WhatsApp `.txt` file.
 * Reads only plain text content and rejects binary or oversized files gracefully.
 */
export async function pickWhatsAppTextFile(): Promise<PickChatFileResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'text/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { status: 'canceled' };
    }

    const asset = result.assets[0];
    const fileName = asset.name || 'whatsapp-chat.txt';

    if (!isSupportedTextAsset(fileName, asset.mimeType)) {
      return {
        status: 'error',
        message: `"${fileName}" is not a .txt file. Please export your WhatsApp chat "Without Media" and select the .txt file.`,
      };
    }

    if (typeof asset.size === 'number' && asset.size > MAX_IMPORT_BYTES) {
      return {
        status: 'error',
        message: 'This chat file is larger than 2 MB. Please export "Without Media" or paste the most recent messages directly.',
      };
    }

    let content = '';
    if (Platform.OS === 'web') {
      if (asset.file) {
        content = await asset.file.text();
      } else {
        const response = await fetch(asset.uri);
        content = await response.text();
      }
    } else {
      const file = new File(asset.uri);
      content = await file.text();
    }

    if (!content.trim()) {
      return {
        status: 'error',
        message: 'The selected file is empty. Please choose a valid WhatsApp chat export.',
      };
    }

    if (isProbablyBinaryText(content)) {
      return {
        status: 'error',
        message: 'This file does not contain readable plain text. Please select a UTF-8 .txt WhatsApp export.',
      };
    }

    return {
      status: 'success',
      fileName,
      content,
      sizeBytes: asset.size,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to read the selected file.';
    return {
      status: 'error',
      message: `Could not import chat file: ${detail}`,
    };
  }
}
