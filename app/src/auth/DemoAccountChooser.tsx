import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

// Demo mode only (no server): stands in for Google's own "Choose an account" page, which the
// real app shows. Google draws that page itself, so this stand-in is in English like a sample.
const SAMPLE_ACCOUNTS = [
  { name: 'Priya Sharma', email: 'priya.demo@gmail.com', color: '#7A5AF8' },
  { name: 'Rahul Verma', email: 'rahul.demo@gmail.com', color: '#2EAD72' },
];

export function DemoAccountChooser({ visible, onChoose, onCancel }: { visible: boolean; onChoose: (email: string) => void; onCancel: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Cancel">
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <MaterialCommunityIcons name="google" size={28} color="#4285F4" style={styles.center} />
          <AppText style={[styles.title, styles.textCenter]}>Choose an account</AppText>
          <AppText style={[styles.sub, styles.textCenter]}>to continue to Ratna Aura</AppText>
          <View style={styles.list}>
            {SAMPLE_ACCOUNTS.map((a) => (
              <Pressable
                key={a.email}
                accessibilityRole="button"
                onPress={() => onChoose(a.email)}
                style={({ pressed }) => [styles.account, pressed && styles.pressed]}
              >
                <View style={[styles.avatar, { backgroundColor: a.color }]}>
                  <AppText style={styles.initial}>{a.name[0]}</AppText>
                </View>
                <View style={styles.flex}>
                  <AppText style={styles.name}>{a.name}</AppText>
                  <AppText style={styles.email}>{a.email}</AppText>
                </View>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.account, pressed && styles.pressed]}>
              <View style={[styles.avatar, styles.other]}>
                <MaterialCommunityIcons name="close" size={20} color="#5F6368" />
              </View>
              <AppText style={styles.name}>Cancel</AppText>
            </Pressable>
          </View>
          <AppText style={[styles.note, styles.textCenter]}>Demo: sample accounts. The real app shows your phone’s Google accounts.</AppText>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Google's page is white whatever the app's colours, so these are its colours, not the brand's.
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  sheet: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: spacing.xl, gap: spacing.xs },
  center: { alignSelf: 'center' },
  textCenter: { textAlign: 'center' },
  title: { fontSize: 22, lineHeight: 30, color: '#202124' },
  sub: { fontSize: 14, lineHeight: 20, color: '#5F6368' },
  list: { marginTop: spacing.lg, borderTopWidth: 1, borderColor: '#DADCE0' },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: '#DADCE0' },
  pressed: { backgroundColor: '#F1F3F4' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  other: { backgroundColor: '#F1F3F4' },
  initial: { color: '#FFFFFF', fontSize: 16, lineHeight: 22 },
  flex: { flex: 1 },
  name: { fontSize: 14, lineHeight: 20, color: '#202124' },
  email: { fontSize: 12, lineHeight: 18, color: '#5F6368' },
  note: { fontSize: 12, lineHeight: 18, color: colors.textFaint, marginTop: spacing.md },
});
