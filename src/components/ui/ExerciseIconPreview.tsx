import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  type GestureResponderEvent,
  type ImageResizeMode,
  type ImageStyle,
  type Insets,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const OPEN_DELAY_MS = 80;

interface ExerciseIconPreviewProps {
  imageSource: ImageSourcePropType;
  previewUri: string | null;
  imageStyle: StyleProp<ImageStyle>;
  touchableStyle?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  imageResizeMode?: ImageResizeMode;
  previewResizeMode?: ImageResizeMode;
  hitSlop?: Insets;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  onImageError?: () => void;
}

export function ExerciseIconPreview({
  imageSource,
  previewUri,
  imageStyle,
  touchableStyle,
  activeOpacity = 0.8,
  imageResizeMode = 'cover',
  previewResizeMode = 'contain',
  hitSlop,
  onPress,
  onLongPress,
  onImageError,
}: ExerciseIconPreviewProps) {
  const { colors } = useTheme();
  const [modalUri, setModalUri] = useState<string | null>(null);
  const previewScale = useRef(new Animated.Value(0.92)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useMemo(() => StyleSheet.create({
    mediaPreviewOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.82)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    mediaPreviewFrame: {
      width: '84%',
      maxWidth: 440,
      aspectRatio: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      padding: 10,
    },
    mediaPreviewImage: {
      width: '100%',
      height: '100%',
    },
  }), [colors.border, colors.surface]);

  useEffect(() => {
    if (!modalUri) return;
    previewScale.setValue(0.92);
    previewOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(previewScale, {
        toValue: 1,
        damping: 18,
        stiffness: 240,
        mass: 0.85,
        useNativeDriver: true,
      }),
      Animated.timing(previewOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [modalUri, previewOpacity, previewScale]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    };
  }, []);

  const closePreview = () => {
    Animated.parallel([
      Animated.timing(previewScale, {
        toValue: 0.96,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(previewOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => setModalUri(null));
  };

  const handlePress = (event: GestureResponderEvent) => {
    onPress?.(event);
    if (!previewUri) return;
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    openTimerRef.current = setTimeout(() => {
      setModalUri(previewUri);
      openTimerRef.current = null;
    }, OPEN_DELAY_MS);
  };

  return (
    <>
      <TouchableOpacity
        style={touchableStyle}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={previewUri ? activeOpacity : 1}
        hitSlop={hitSlop}
      >
        <Image
          source={imageSource}
          style={imageStyle}
          resizeMode={imageResizeMode}
          onError={onImageError}
        />
      </TouchableOpacity>

      <Modal
        visible={!!modalUri}
        transparent
        animationType="none"
        onRequestClose={closePreview}
        statusBarTranslucent
      >
        <Pressable style={styles.mediaPreviewOverlay} onPress={closePreview}>
          <Animated.View
            style={[
              styles.mediaPreviewFrame,
              { opacity: previewOpacity, transform: [{ scale: previewScale }] },
            ]}
          >
            {modalUri && (
              <Image
                source={{ uri: modalUri }}
                style={styles.mediaPreviewImage}
                resizeMode={previewResizeMode}
              />
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}
