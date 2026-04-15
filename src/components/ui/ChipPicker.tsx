import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { DayOfWeek, DAY_LABELS } from '../../models';
import { colors, fonts } from '../../constants';

interface ChipPickerProps<T extends string | number> {
  items: { key: string; label: string; value: T }[];
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
  horizontal = true,
  maxHeight,
}: ChipPickerProps<T>) {
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
            ]}
            onPress={() => {
              if (isSelected && allowDeselect) {
                onChange(null);
              } else {
                onChange(item.value);
              }
            }}
          >
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
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!useScrollContainer) {
    return <View style={[styles.scroll, style]}>{content}</View>;
  }

  return (
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

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowWrap: {
    flexWrap: 'wrap',
  },
  wrapRow: {
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
  },
  chipSelected: {
    backgroundColor: colors.text,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: colors.background,
  },
});
