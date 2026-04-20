import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button } from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PICKER_H = Platform.OS === 'ios' ? 200 : 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

interface DurationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (totalSeconds: number) => void;
  value: number;
}

export function DurationPickerModal({ visible, onClose, onConfirm, value }: DurationPickerModalProps) {
  const { colors } = useTheme();
  const androidPickerPopupTextColor = '#111111';
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [modalVisible, setModalVisible] = useState(false);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (visible) {
      setHours(Math.floor(value / 3600));
      setMinutes(Math.floor((value % 3600) / 60));
      setSeconds(Math.round(value % 60));

      overlayOpacity.setValue(0);
      sheetY.setValue(SCREEN_HEIGHT);
      setModalVisible(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(sheetY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start(() => setModalVisible(false));
    }
  }, [visible]);

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { flex: 1, justifyContent: 'flex-end' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingHorizontal: 24,
      paddingBottom: 36,
    },
    closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
    closeBtnText: { fontSize: 18, color: colors.textMuted },
    title: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    labelsRow: { flexDirection: 'row', paddingHorizontal: 12 },
    label: { flex: 1, fontSize: 12, fontFamily: fonts.bold, color: colors.textMuted, textAlign: 'center' },
    pickerRow: { flexDirection: 'row', alignItems: 'center', height: PICKER_H, marginBottom: 20 },
    pickerSlot: { flex: 1, height: PICKER_H },
    picker: { height: PICKER_H, color: colors.text },
    separator: {
      fontSize: 24,
      fontFamily: fonts.bold,
      color: colors.textMuted,
      width: 20,
      textAlign: 'center',
      marginTop: Platform.OS === 'ios' ? 8 : 0,
    },
  }), [colors]);

  const handleConfirm = () => {
    onConfirm(hours * 3600 + minutes * 60 + seconds);
    onClose();
  };

  const itemStyle = Platform.OS === 'ios' ? { color: colors.text, fontSize: 22 } : undefined;

  return (
    <Modal visible={modalVisible} animationType="none" transparent>
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </Pressable>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7} hitSlop={8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Set Duration</Text>

          <View style={styles.labelsRow}>
            <Text style={styles.label}>Hours</Text>
            <Text style={styles.label}>Min</Text>
            <Text style={styles.label}>Sec</Text>
          </View>

          <View style={styles.pickerRow}>
            <View style={styles.pickerSlot}>
              <Picker
                selectedValue={hours}
                onValueChange={setHours}
                style={styles.picker}
                itemStyle={itemStyle}
                mode={Platform.OS === 'android' ? 'dropdown' : undefined}
                dropdownIconColor={colors.text}
              >
                {HOURS.map((v) => (
                  <Picker.Item
                    key={v}
                    label={String(v).padStart(2, '0')}
                    value={v}
                    color={Platform.OS === 'android' ? androidPickerPopupTextColor : colors.text}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.separator}>:</Text>
            <View style={styles.pickerSlot}>
              <Picker
                selectedValue={minutes}
                onValueChange={setMinutes}
                style={styles.picker}
                itemStyle={itemStyle}
                mode={Platform.OS === 'android' ? 'dropdown' : undefined}
                dropdownIconColor={colors.text}
              >
                {MINUTES.map((v) => (
                  <Picker.Item
                    key={v}
                    label={String(v).padStart(2, '0')}
                    value={v}
                    color={Platform.OS === 'android' ? androidPickerPopupTextColor : colors.text}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.separator}>:</Text>
            <View style={styles.pickerSlot}>
              <Picker
                selectedValue={seconds}
                onValueChange={setSeconds}
                style={styles.picker}
                itemStyle={itemStyle}
                mode={Platform.OS === 'android' ? 'dropdown' : undefined}
                dropdownIconColor={colors.text}
              >
                {SECONDS.map((v) => (
                  <Picker.Item
                    key={v}
                    label={String(v).padStart(2, '0')}
                    value={v}
                    color={Platform.OS === 'android' ? androidPickerPopupTextColor : colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <Button title="Confirm" onPress={handleConfirm} />
        </Animated.View>
      </View>
    </Modal>
  );
}
