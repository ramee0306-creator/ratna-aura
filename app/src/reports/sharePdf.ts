// Turning report HTML into a PDF and opening the phone's share sheet (save to Files, WhatsApp, print…).
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function sharePdf(html: string, title: string): Promise<void> {
  if (Platform.OS === 'web') {
    // The browser's print dialog can save as PDF.
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
  else await Print.printAsync({ uri });
}
