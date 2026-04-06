import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  View,
  ScrollView,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, fonts } from '../../constants';
import { KeyboardDismiss } from './KeyboardDismiss';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface BottomSheetModalProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  fullHeight?: boolean;
  onClose?: () => void;
}

export function BottomSheetModal({
  visible,
  title,
  children,
  scrollable = false,
  fullHeight = false,
  onClose,
}: BottomSheetModalProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 250 }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable ? { keyboardShouldPersistTaps: 'handled' as const } : {};

  const Wrapper = fullHeight ? View : KeyboardAvoidingView;
  const wrapperProps = fullHeight
    ? { style: styles.wrapper }
    : { style: styles.wrapper, behavior: Platform.OS === 'ios' ? ('padding' as const) : undefined };

  return (
    <Modal visible={modalVisible} animationType="none" transparent>
      <Wrapper {...wrapperProps}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </Pressable>
        <Animated.View
          style={[
            fullHeight ? styles.sheetWrapperFull : styles.sheetWrapper,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <Body style={[styles.sheet, fullHeight && styles.sheetFull]} {...bodyProps}>
            {(title || onClose) ? (
              <View style={styles.header}>
                {title ? <Text style={styles.title}>{title}</Text> : <View />}
                {onClose && (
                  <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={8}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
            {children}
          </Body>
        </Animated.View>
        <KeyboardDismiss />
      </Wrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    maxHeight: '85%',
  },
  sheetWrapperFull: {
    flex: 1,
    marginTop: 48,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '100%',
  },
  sheetFull: {
    flex: 1,
    maxHeight: undefined,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  closeBtn: {
    fontSize: 18,
    color: colors.textMuted,
    paddingLeft: 12,
  },
});
