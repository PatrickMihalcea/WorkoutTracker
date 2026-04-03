import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
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
}

export function BottomSheetModal({
  visible,
  title,
  children,
  scrollable = false,
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

  return (
    <Modal visible={modalVisible} animationType="none" transparent>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: sheetTranslateY }] }]}>
          <Body style={styles.sheet} {...bodyProps}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {children}
          </Body>
        </Animated.View>
        <KeyboardDismiss />
      </KeyboardAvoidingView>
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
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '100%',
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 20,
  },
});
