import { type ReactNode, useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoBanner } from '@/components/DemoBanner';
import { MAX_CONTENT_WIDTH, spacing } from '@/theme';

import { StarryBackground } from './StarryBackground';

/**
 * Standard page: night-sky background, safe margins, scrolls when content is long.
 * `footer` stays fixed under the scrolling part; when `scrollToEndOn` changes, the page scrolls to the bottom (chats).
 */
export function Screen({ children, footer, scrollToEndOn }: { children: ReactNode; footer?: ReactNode; scrollToEndOn?: unknown }) {
  const scroll = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    if (scrollToEndOn !== undefined) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [scrollToEndOn]);
  return (
    <View style={styles.root}>
      <StarryBackground />
      <SafeAreaView style={styles.safe}>
        <DemoBanner />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scroll} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>{children}</View>
          </ScrollView>
          {footer ? <View style={[styles.content, styles.footer]}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  content: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },
});
