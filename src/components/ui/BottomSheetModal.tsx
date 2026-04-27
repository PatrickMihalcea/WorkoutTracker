import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';
import { KeyboardDismiss } from './KeyboardDismiss';
import { Portal } from './PortalHost';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface BottomSheetModalProps {
  visible: boolean;
  animated?: boolean;
  presentation?: 'modal' | 'inline';
  topInset?: number;
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  fullHeight?: boolean;
  showCloseButton?: boolean;
  contentPaddingHorizontal?: number;
  sheetStyle?: StyleProp<ViewStyle>;
  onClose?: () => void;
}

export function BottomSheetModal({
  visible,
  animated = true,
  presentation = 'modal',
  topInset = 0,
  title,
  children,
  scrollable = false,
  fullHeight = false,
  showCloseButton = true,
  contentPaddingHorizontal = 24,
  sheetStyle,
  onClose,
}: BottomSheetModalProps) {
  const { colors } = useTheme();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (modalVisible) {
        if (!animated) {
          overlayOpacity.setValue(1);
          sheetTranslateY.setValue(0);
        }
        return;
      }
      if (!animated) {
        overlayOpacity.setValue(1);
        sheetTranslateY.setValue(0);
        setModalVisible(true);
        return;
      }
      overlayOpacity.setValue(0);
      sheetTranslateY.setValue(SCREEN_HEIGHT);
      setModalVisible(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(sheetTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    } else if (modalVisible) {
      if (!animated) {
        setModalVisible(false);
        return;
      }
      const fallback = setTimeout(() => setModalVisible(false), 250);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        clearTimeout(fallback);
        setModalVisible(false);
      });
      return () => clearTimeout(fallback);
    }
  }, [animated, modalVisible, overlayOpacity, sheetTranslateY, visible]);

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { flex: 1, justifyContent: 'flex-end' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheetWrapper: { maxHeight: '85%' },
    sheetWrapperFull: { flex: 1, marginTop: 48 },
    sheetWrapperFullInline: { flex: 1 },
    sheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
      paddingTop: 24,
      paddingHorizontal: 24,
      paddingBottom: 24,
      maxHeight: '100%',
      overflow: 'hidden',
    },
    scrollBody: { flexShrink: 1 },
    viewBody: { flexGrow: 1, flexShrink: 1 },
    sheetFull: { flex: 1, maxHeight: undefined },
    title: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: 20,
    },
    closeBtnOverlay: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
    closeBtn: { fontSize: 18, color: colors.textMuted },
  }), [colors]);

  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable ? { keyboardShouldPersistTaps: 'handled' as const } : {};

  const Wrapper = fullHeight ? View : KeyboardAvoidingView;
  const wrapperProps = fullHeight
    ? { style: styles.wrapper }
    : { style: styles.wrapper, behavior: Platform.OS === 'ios' ? ('padding' as const) : undefined };

  const content = (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Wrapper {...wrapperProps}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </Pressable>
        <Animated.View
          style={[
            fullHeight
              ? (
                presentation === 'inline'
                  ? [styles.sheetWrapperFullInline, topInset > 0 ? { marginTop: topInset } : null]
                  : styles.sheetWrapperFull
              )
              : styles.sheetWrapper,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          {onClose && showCloseButton && (
            <TouchableOpacity style={styles.closeBtnOverlay} onPress={onClose} activeOpacity={0.7} hitSlop={8}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          )}
          <View style={[styles.sheet, { paddingHorizontal: contentPaddingHorizontal, backgroundColor: colors.surface }, fullHeight && styles.sheetFull, sheetStyle]}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <Body style={scrollable ? styles.scrollBody : styles.viewBody} {...bodyProps}>
              {children}
            </Body>
          </View>
        </Animated.View>
        <KeyboardDismiss />
      </Wrapper>
    </View>
  );

  if (presentation === 'inline') {
    if (!modalVisible) return null;
    return <Portal>{content}</Portal>;
  }

  return (
    <Modal visible={modalVisible} animationType="none" transparent>
      {content}
    </Modal>
  );
}
