import { useEffect, useState, useMemo } from 'react';
import {
  Keyboard,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export function KeyboardDismiss() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [bottom] = useState(new Animated.Value(0));

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: { endCoordinates: { height: number } }) => {
      setVisible(true);
      Animated.timing(bottom, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? 250 : 0,
        useNativeDriver: false,
      }).start();
    };

    const onHide = () => {
      Animated.timing(bottom, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 200 : 0,
        useNativeDriver: false,
      }).start(() => setVisible(false));
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [bottom]);

  const styles = useMemo(() => StyleSheet.create({
    container: { position: 'absolute', right: 12, zIndex: 9999, elevation: 9999 },
    button: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrow: { fontSize: 16, lineHeight: 18, color: colors.text },
  }), [colors]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { bottom }]} pointerEvents="box-none">
      <TouchableOpacity style={styles.button} onPress={Keyboard.dismiss} activeOpacity={0.7}>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
