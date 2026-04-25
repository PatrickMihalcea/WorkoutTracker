import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fonts } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import {
  EditorDirection,
  EditableFieldKind,
  RIR_STEP_VALUES,
  isNumericEditableField,
} from '../set-editor/types';
import { RirCircle } from './RirCircle';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DURATION_PICKER_HEIGHT = Platform.OS === 'ios' ? 200 : 56;
const FIXED_SHEET_HEIGHT = 340;
const MODAL_EXIT_OVERLAY_MS = 260;
const MODAL_EXIT_SHEET_MS = 340;
const MODAL_ENTER_OVERLAY_MS = MODAL_EXIT_OVERLAY_MS;
const MODAL_ENTER_SHEET_MS = MODAL_EXIT_SHEET_MS;
const DURATION_HOURS = Array.from({ length: 24 }, (_, i) => i);
const DURATION_MINUTES = Array.from({ length: 60 }, (_, i) => i);
const DURATION_SECONDS = Array.from({ length: 60 }, (_, i) => i);

interface SetValueEditorModalProps {
  visible: boolean;
  animated?: boolean;
  animateOpen?: boolean;
  animateDoneExit?: boolean;
  field: EditableFieldKind | null;
  syncKey?: string;
  numericValue: string;
  allowDecimal: boolean;
  durationValue: number;
  rirValue: number | null;
  canNavigate?: Partial<Record<EditorDirection, boolean>>;
  title?: string;
  onClose: () => void;
  onDone: () => void;
  onNavigate: (direction: EditorDirection) => void;
  onEnter?: () => void;
  onNumericValueChange: (value: string) => void;
  onDurationValueChange: (seconds: number) => void;
  onRirValueChange: (value: number | null) => void;
}

interface ArrowButtonProps {
  direction: EditorDirection;
  symbol: string;
  enabled: boolean;
  onPress: (direction: EditorDirection) => void;
}

function ArrowButton({ direction, symbol, enabled, onPress }: ArrowButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    arrowButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.accentDim,
      backgroundColor: colors.surface,
      opacity: enabled ? 1 : 0.45,
    },
    arrowText: {
      color: colors.text,
      fontSize: 20,
      fontFamily: fonts.semiBold,
      lineHeight: 22,
    },
  }), [colors, enabled]);

  return (
    <TouchableOpacity
      style={styles.arrowButton}
      onPress={() => onPress(direction)}
      disabled={!enabled}
      activeOpacity={0.7}
    >
      <Text style={styles.arrowText}>{symbol}</Text>
    </TouchableOpacity>
  );
}

export function SetValueEditorModal({
  visible,
  animated = true,
  animateOpen = false,
  animateDoneExit = false,
  field,
  syncKey,
  numericValue,
  allowDecimal,
  durationValue,
  rirValue,
  canNavigate,
  onClose,
  onDone,
  onNavigate,
  onEnter,
  onNumericValueChange,
  onDurationValueChange,
  onRirValueChange,
}: SetValueEditorModalProps) {
  const { colors } = useTheme();
  const androidPickerPopupTextColor = '#111111';
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [numericReplaceMode, setNumericReplaceMode] = useState(false);
  const [doneExitAnimating, setDoneExitAnimating] = useState(false);
  const doneCloseInFlightRef = useRef(false);
  const useAnimatedOpen = animated || animateOpen;
  const useAnimatedPresentation = useAnimatedOpen || doneExitAnimating;

  const animateModalOut = (overlayDuration: number, sheetDuration: number, onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: overlayDuration, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: SCREEN_HEIGHT, duration: sheetDuration, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      onComplete?.();
    });
  };

  useEffect(() => {
    if (!useAnimatedOpen) {
      if (doneCloseInFlightRef.current) return;
      setModalVisible(visible);
      return;
    }

    if (visible) {
      if (modalVisible) return;

      overlayOpacity.setValue(0);
      sheetTranslateY.setValue(SCREEN_HEIGHT);
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: MODAL_ENTER_OVERLAY_MS, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: 0, duration: MODAL_ENTER_SHEET_MS, useNativeDriver: true }),
      ]).start();
      return;
    }

    if (!modalVisible) return;
    if (doneCloseInFlightRef.current) return;
    animateModalOut(180, 180);
  }, [modalVisible, useAnimatedOpen, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || field !== 'duration') return;
    const safeDuration = Math.max(0, Math.floor(durationValue || 0));
    setHours(Math.floor(safeDuration / 3600));
    setMinutes(Math.floor((safeDuration % 3600) / 60));
    setSeconds(safeDuration % 60);
  }, [field, syncKey, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || !isNumericEditableField(field)) return;
    setNumericReplaceMode(true);
  }, [field, syncKey, visible]);

  const setDurationFromParts = (nextHours: number, nextMinutes: number, nextSeconds: number) => {
    setHours(nextHours);
    setMinutes(nextMinutes);
    setSeconds(nextSeconds);
    onDurationValueChange((nextHours * 3600) + (nextMinutes * 60) + nextSeconds);
  };

  const handleDigitPress = (digit: string) => {
    if (numericReplaceMode) {
      onNumericValueChange(digit);
      setNumericReplaceMode(false);
      return;
    }
    const current = numericValue ?? '';
    if (current === '0') {
      onNumericValueChange(digit);
      return;
    }
    onNumericValueChange(`${current}${digit}`);
  };

  const handleDotPress = () => {
    if (!allowDecimal) return;
    if (numericReplaceMode) {
      onNumericValueChange('0.');
      setNumericReplaceMode(false);
      return;
    }
    const current = numericValue ?? '';
    if (current.includes('.')) return;
    if (!current) {
      onNumericValueChange('0.');
      return;
    }
    onNumericValueChange(`${current}.`);
  };

  const handleBackspace = () => {
    if (numericReplaceMode) {
      onNumericValueChange('');
      setNumericReplaceMode(false);
      return;
    }
    const current = numericValue ?? '';
    if (!current) return;
    onNumericValueChange(current.slice(0, -1));
  };

  const isNumericEditor = isNumericEditableField(field);
  const isDurationEditor = field === 'duration';
  const isRirEditor = field === 'rir';
  const handleEnterPress = () => {
    if (onEnter) {
      onEnter();
      return;
    }
    if (canNavigate?.right !== false) {
      onNavigate('right');
    }
  };

  const handleDonePress = () => {
    if (!animateDoneExit) {
      onDone();
      return;
    }
    if (doneCloseInFlightRef.current) return;
    doneCloseInFlightRef.current = true;
    setDoneExitAnimating(true);
    overlayOpacity.setValue(1);
    sheetTranslateY.setValue(0);
    setModalVisible(true);
    animateModalOut(MODAL_EXIT_OVERLAY_MS, MODAL_EXIT_SHEET_MS, () => {
      doneCloseInFlightRef.current = false;
      setDoneExitAnimating(false);
      onDone();
    });
  };

  const styles = useMemo(() => StyleSheet.create({
    wrapper: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    sheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1.5,
      borderColor: colors.accentDim,
      backgroundColor: colors.surface,
      paddingTop: 10,
      paddingHorizontal: 14,
      paddingBottom: 10,
      height: FIXED_SHEET_HEIGHT,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: -4 },
      elevation: 12,
    },
    body: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
      height: 238,
    },
    rail: {
      width: 44,
      alignItems: 'center',
      gap: 8,
      paddingTop: 8,
    },
    enterBtn: {
      width: 44,
      height: 74,
      marginTop: 12,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    enterBtnDisabled: {
      opacity: 0.45,
    },
    enterIcon: {
      width: 18,
      height: 18,
      tintColor: '#000000',
      resizeMode: 'contain',
    },
    center: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.accentDim,
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    currentValueWrap: {
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.accentDim,
      backgroundColor: colors.accentDim,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 10,
      minHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    currentValue: {
      color: colors.text,
      fontSize: 20,
      fontFamily: fonts.bold,
      textAlign: 'center',
    },
    currentValueMuted: {
      color: colors.textMuted,
    },
    keypadGrid: {
      gap: 7,
      alignSelf: 'center',
      width: '98%',
    },
    keypadRow: {
      flexDirection: 'row',
      gap: 7,
    },
    keyBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyText: {
      color: colors.text,
      fontSize: 18,
      fontFamily: fonts.semiBold,
    },
    backspaceIcon: {
      width: 18,
      height: 18,
      tintColor: '#FFFFFF',
      resizeMode: 'contain',
    },
    durationLabels: {
      flexDirection: 'row',
      marginBottom: 4,
      paddingHorizontal: 0,
    },
    durationLabel: {
      flex: 1,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: fonts.semiBold,
    },
    durationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: DURATION_PICKER_HEIGHT,
      marginBottom: 0,
    },
    durationSlot: {
      flex: 1,
      flexBasis: 0,
      height: DURATION_PICKER_HEIGHT,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    durationPicker: {
      height: DURATION_PICKER_HEIGHT,
      width: '100%',
      color: '#FFFFFF',
    },
    durationSeparator: {
      width: 8,
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 20,
      fontFamily: fonts.bold,
      marginTop: Platform.OS === 'ios' ? 8 : 0,
    },
    rirRows: {
      gap: 10,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 6,
    },
    rirRow: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rirSelected: {
      opacity: 1,
    },
    rirUnselected: {
      opacity: 0.45,
    },
    doneBtn: {
      marginTop: 4,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.accent,
      backgroundColor: colors.accent,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneText: {
      color: colors.background,
      fontSize: 15,
      fontFamily: fonts.bold,
    },
  }), [colors]);

  const itemStyle = Platform.OS === 'ios'
    ? {
        color: '#FFFFFF',
        fontSize: 12,
        textAlign: 'center' as const,
      }
    : undefined;

  if (useAnimatedPresentation && !modalVisible) return null;
  if (!useAnimatedPresentation && !visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[styles.overlay, { opacity: useAnimatedPresentation ? overlayOpacity : 1 }]} />
      </View>

      <Animated.View
        pointerEvents="auto"
        style={[styles.sheet, { transform: [{ translateY: useAnimatedPresentation ? sheetTranslateY : 0 }] }]}
      >
        <View style={styles.body}>
          <View style={styles.rail}>
            <ArrowButton direction="up" symbol="↑" enabled={canNavigate?.up !== false} onPress={onNavigate} />
            <ArrowButton direction="left" symbol="←" enabled={canNavigate?.left !== false} onPress={onNavigate} />
          </View>

          <View style={styles.center}>
              {isNumericEditor && (
                <>
                  <View style={styles.keypadGrid}>
                    <View style={styles.keypadRow}>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('1')} activeOpacity={0.7}><Text style={styles.keyText}>1</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('2')} activeOpacity={0.7}><Text style={styles.keyText}>2</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('3')} activeOpacity={0.7}><Text style={styles.keyText}>3</Text></TouchableOpacity>
                    </View>
                    <View style={styles.keypadRow}>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('4')} activeOpacity={0.7}><Text style={styles.keyText}>4</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('5')} activeOpacity={0.7}><Text style={styles.keyText}>5</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('6')} activeOpacity={0.7}><Text style={styles.keyText}>6</Text></TouchableOpacity>
                    </View>
                    <View style={styles.keypadRow}>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('7')} activeOpacity={0.7}><Text style={styles.keyText}>7</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('8')} activeOpacity={0.7}><Text style={styles.keyText}>8</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('9')} activeOpacity={0.7}><Text style={styles.keyText}>9</Text></TouchableOpacity>
                    </View>
                    <View style={styles.keypadRow}>
                      <TouchableOpacity
                        style={styles.keyBtn}
                        onPress={handleDotPress}
                        activeOpacity={0.7}
                        disabled={!allowDecimal}
                      >
                        <Text style={styles.keyText}>.</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('0')} activeOpacity={0.7}><Text style={styles.keyText}>0</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.keyBtn} onPress={handleBackspace} activeOpacity={0.7}>
                        <Image source={require('../../../assets/icons/backspace.png')} style={styles.backspaceIcon} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {isDurationEditor && (
                <>
                  <View style={styles.durationLabels}>
                    <Text style={styles.durationLabel}>Hours</Text>
                    <Text style={styles.durationLabel}>Min</Text>
                    <Text style={styles.durationLabel}>Sec</Text>
                  </View>
                  <View style={styles.durationRow}>
                    <View style={styles.durationSlot}>
                      <Picker
                        selectedValue={hours}
                        onValueChange={(value: number) => setDurationFromParts(value, minutes, seconds)}
                        style={styles.durationPicker}
                        itemStyle={itemStyle}
                        mode={Platform.OS === 'android' ? 'dropdown' : undefined}
                        dropdownIconColor={colors.text}
                      >
                        {DURATION_HOURS.map((value) => (
                          <Picker.Item
                            key={value}
                            label={String(value).padStart(2, '0')}
                            value={value}
                            color={Platform.OS === 'android' ? androidPickerPopupTextColor : colors.text}
                          />
                        ))}
                      </Picker>
                    </View>
                    <Text style={styles.durationSeparator}>:</Text>
                    <View style={styles.durationSlot}>
                      <Picker
                        selectedValue={minutes}
                        onValueChange={(value: number) => setDurationFromParts(hours, value, seconds)}
                        style={styles.durationPicker}
                        itemStyle={itemStyle}
                        mode={Platform.OS === 'android' ? 'dropdown' : undefined}
                        dropdownIconColor={colors.text}
                      >
                        {DURATION_MINUTES.map((value) => (
                          <Picker.Item
                            key={value}
                            label={String(value).padStart(2, '0')}
                            value={value}
                            color={Platform.OS === 'android' ? androidPickerPopupTextColor : colors.text}
                          />
                        ))}
                      </Picker>
                    </View>
                    <Text style={styles.durationSeparator}>:</Text>
                    <View style={styles.durationSlot}>
                      <Picker
                        selectedValue={seconds}
                        onValueChange={(value: number) => setDurationFromParts(hours, minutes, value)}
                        style={styles.durationPicker}
                        itemStyle={itemStyle}
                        mode={Platform.OS === 'android' ? 'dropdown' : undefined}
                        dropdownIconColor={colors.text}
                      >
                        {DURATION_SECONDS.map((value) => (
                          <Picker.Item
                            key={value}
                            label={String(value).padStart(2, '0')}
                            value={value}
                            color={Platform.OS === 'android' ? androidPickerPopupTextColor : colors.text}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </>
              )}

              {isRirEditor && (
                <>
                  <View style={styles.rirRows}>
                    <View style={styles.rirRow}>
                      {RIR_STEP_VALUES.slice(0, 4).map((value) => (
                        <RirCircle
                          key={value === null ? 'clear' : String(value)}
                          value={value}
                          size={42}
                          onPress={() => onRirValueChange(value)}
                          textColorOverride={value !== null ? '#000000' : undefined}
                          style={value === rirValue ? styles.rirSelected : styles.rirUnselected}
                        />
                      ))}
                    </View>
                    <View style={styles.rirRow}>
                      {RIR_STEP_VALUES.slice(4, 7).map((value) => (
                        <RirCircle
                          key={value === null ? 'clear-mid' : String(value)}
                          value={value}
                          size={42}
                          onPress={() => onRirValueChange(value)}
                          textColorOverride={value !== null ? '#000000' : undefined}
                          style={value === rirValue ? styles.rirSelected : styles.rirUnselected}
                        />
                      ))}
                    </View>
                    <View style={styles.rirRow}>
                      {RIR_STEP_VALUES.slice(7).map((value) => (
                        <RirCircle
                          key={value === null ? 'clear-last' : String(value)}
                          value={value}
                          size={42}
                          onPress={() => onRirValueChange(value)}
                          textColorOverride={value !== null ? '#000000' : undefined}
                          style={value === rirValue ? styles.rirSelected : styles.rirUnselected}
                        />
                      ))}
                    </View>
                  </View>
                </>
              )}

              {!isNumericEditor && !isDurationEditor && !isRirEditor && (
                <View style={styles.currentValueWrap}>
                  <Text style={[styles.currentValue, styles.currentValueMuted]}>Unsupported field</Text>
                </View>
              )}
          </View>

          <View style={styles.rail}>
            <ArrowButton direction="down" symbol="↓" enabled={canNavigate?.down !== false} onPress={onNavigate} />
            <ArrowButton direction="right" symbol="→" enabled={canNavigate?.right !== false} onPress={onNavigate} />
            <TouchableOpacity
              style={styles.enterBtn}
              onPress={handleEnterPress}
              activeOpacity={0.7}
            >
              <Image source={require('../../../assets/icons/enter.png')} style={styles.enterIcon} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDonePress} activeOpacity={0.8}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
