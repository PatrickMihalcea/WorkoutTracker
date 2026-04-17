import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, StyleProp, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DayOfWeek, DAY_LABELS } from '../../models';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

interface ChipPickerProps<T extends string | number> {
  items: { key: string; label: string; value: T; tooltip?: string }[];
  selected: T | null;
  onChange: (value: T | null) => void;
  /** When true, tapping the active chip deselects it. Default: true */
  allowDeselect?: boolean;
  style?: ViewStyle;
  keyboardPersistTaps?: boolean;
  chipStyle?: StyleProp<ViewStyle>;
  chipSelectedStyle?: StyleProp<ViewStyle>;
  chipTextStyle?: StyleProp<TextStyle>;
  chipTextSelectedStyle?: StyleProp<TextStyle>;
  getChipStyle?: (item: { key: string; label: string; value: T }, isSelected: boolean) => StyleProp<ViewStyle> | undefined;
  getChipTextStyle?: (item: { key: string; label: string; value: T }, isSelected: boolean) => StyleProp<TextStyle> | undefined;
  /** Return custom gradient stop colors for a chip's selected state, or undefined to use the default. */
  getChipGradientColors?: (item: { key: string; label: string; value: T }, isSelected: boolean) => readonly [string, string, ...string[]] | undefined;
  horizontal?: boolean;
  maxHeight?: number;
}

export function ChipPicker<T extends string | number>({
  items,
  selected,
  onChange,
  allowDeselect = true,
  style,
  keyboardPersistTaps = false,
  chipStyle,
  chipSelectedStyle,
  chipTextStyle,
  chipTextSelectedStyle,
  getChipStyle,
  getChipTextStyle,
  getChipGradientColors,
  horizontal = true,
  maxHeight,
}: ChipPickerProps<T>) {
  const { colors, gradients } = useTheme();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');

  const styles = useMemo(() => StyleSheet.create({
    scroll: { flexGrow: 0, marginBottom: 16 },
    row: { flexDirection: 'row', gap: 8 },
    rowWrap: { flexWrap: 'wrap' },
    wrapRow: { paddingRight: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceLight,
      overflow: 'hidden',
    },
    chipWithTooltip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    chipSelected: { backgroundColor: colors.text },
    chipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontFamily: fonts.semiBold,
      textTransform: 'capitalize',
    },
    chipTextSelected: { color: colors.background },
    tooltipBtn: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tooltipBtnSelected: { borderColor: colors.background },
    tooltipBtnText: {
      color: colors.accent,
      fontSize: 10,
      fontFamily: fonts.semiBold,
      lineHeight: 13,
    },
    tooltipBtnTextSelected: { color: colors.background },
    tooltipOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    tooltipCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 14,
      maxWidth: 320,
      width: '100%',
    },
    tooltipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tooltipHeaderIcon: { color: colors.textSecondary, fontSize: 13 },
    tooltipHeaderTitle: {
      color: colors.text,
      fontSize: 13,
      fontFamily: fonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    tooltipDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: -20 },
    tooltipCardText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: fonts.regular,
      lineHeight: 22,
    },
    tooltipDismissBtn: {
      alignSelf: 'stretch',
      marginTop: 4,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    tooltipDismissBtnText: { color: colors.text, fontSize: 14, fontFamily: fonts.semiBold },
  }), [colors]);

  const useScrollContainer = horizontal || !!maxHeight;
  const content = (
    <View style={[styles.row, !horizontal && styles.rowWrap]}>
      {items.map((item) => {
        const isSelected = selected === item.value;
        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.85}
            style={[
              styles.chip,
              chipStyle,
              isSelected && styles.chipSelected,
              isSelected && chipSelectedStyle,
              getChipStyle?.(item, isSelected),
              item.tooltip ? styles.chipWithTooltip : null,
            ]}
            onPress={() => {
              if (isSelected && allowDeselect) {
                onChange(null);
              } else {
                onChange(item.value);
              }
            }}
          >
            {isSelected && (
              <LinearGradient
                colors={getChipGradientColors?.(item, isSelected) ?? gradients.chipSelected}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Text
              style={[
                styles.chipText,
                chipTextStyle,
                isSelected && styles.chipTextSelected,
                isSelected && chipTextSelectedStyle,
                getChipTextStyle?.(item, isSelected),
              ]}
            >
              {item.label}
            </Text>
            {item.tooltip && (
              <TouchableOpacity
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={(e) => {
                  e.stopPropagation();
                  setTooltipContent(item.tooltip!);
                  setTooltipVisible(true);
                }}
                style={[styles.tooltipBtn, isSelected && styles.tooltipBtnSelected]}
              >
                <Text style={[styles.tooltipBtnText, isSelected && styles.tooltipBtnTextSelected]}>?</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const tooltipModal = (
    <Modal
      visible={tooltipVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setTooltipVisible(false)}
    >
      <Pressable style={styles.tooltipOverlay} onPress={() => setTooltipVisible(false)}>
        <Pressable style={styles.tooltipCard} onPress={() => {}}>
          <View style={styles.tooltipHeader}>
            <Text style={styles.tooltipHeaderIcon}>✦</Text>
            <Text style={styles.tooltipHeaderTitle}>How it works</Text>
          </View>
          <View style={styles.tooltipDivider} />
          <Text style={styles.tooltipCardText}>{tooltipContent}</Text>
          <TouchableOpacity onPress={() => setTooltipVisible(false)} style={styles.tooltipDismissBtn}>
            <Text style={styles.tooltipDismissBtnText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (!useScrollContainer) {
    return (
      <>
        <View style={[styles.scroll, style]}>{content}</View>
        {tooltipModal}
      </>
    );
  }

  return (
    <>
      <ScrollView
        horizontal={horizontal}
        showsHorizontalScrollIndicator={horizontal}
        showsVerticalScrollIndicator={!horizontal}
        style={[styles.scroll, !horizontal && maxHeight ? { maxHeight } : null, style]}
        keyboardShouldPersistTaps={keyboardPersistTaps ? 'always' : undefined}
        keyboardDismissMode={keyboardPersistTaps ? 'none' : undefined}
        contentContainerStyle={!horizontal ? styles.wrapRow : undefined}
      >
        {content}
      </ScrollView>
      {tooltipModal}
    </>
  );
}

interface MultiChipPickerProps<T extends string | number> {
  items: { key: string; label: string; value: T }[];
  selected: T[];
  onChange: (values: T[]) => void;
  style?: ViewStyle;
  horizontal?: boolean;
  maxHeight?: number;
}

export function MultiChipPicker<T extends string | number>({
  items,
  selected,
  onChange,
  style,
  horizontal = true,
  maxHeight,
}: MultiChipPickerProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    scroll: { flexGrow: 0, marginBottom: 16 },
    row: { flexDirection: 'row', gap: 8 },
    rowWrap: { flexWrap: 'wrap' },
    wrapRow: { paddingRight: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceLight,
      overflow: 'hidden',
    },
    chipSelected: { backgroundColor: colors.text },
    chipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontFamily: fonts.semiBold,
      textTransform: 'capitalize',
    },
    chipTextSelected: { color: colors.background },
  }), [colors]);

  return (
    <ScrollView
      horizontal={horizontal}
      showsHorizontalScrollIndicator={horizontal}
      showsVerticalScrollIndicator={!horizontal}
      style={[styles.scroll, !horizontal && maxHeight ? { maxHeight } : null, style]}
      contentContainerStyle={!horizontal ? styles.wrapRow : undefined}
    >
      <View style={[styles.row, !horizontal && styles.rowWrap]}>
        {items.map((item) => {
          const isSelected = selected.includes(item.value);
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => {
                if (isSelected) {
                  onChange(selected.filter((v) => v !== item.value));
                } else {
                  onChange([...selected, item.value]);
                }
              }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const DAY_ITEMS = Object.entries(DAY_LABELS).map(([key, label]) => ({
  key,
  label: label.slice(0, 3),
  value: Number(key) as DayOfWeek,
}));

interface DayOfWeekPickerProps {
  selected: DayOfWeek | null;
  onChange: (day: DayOfWeek | null) => void;
  style?: ViewStyle;
}

export function DayOfWeekPicker({ selected, onChange, style }: DayOfWeekPickerProps) {
  return (
    <ChipPicker items={DAY_ITEMS} selected={selected} onChange={onChange} style={style} />
  );
}
