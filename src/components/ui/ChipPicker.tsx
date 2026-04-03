import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { DayOfWeek, DAY_LABELS } from '../../models';
import { colors, fonts } from '../../constants';

interface ChipPickerProps<T extends string | number> {
  items: { key: string; label: string; value: T }[];
  selected: T | null;
  onChange: (value: T | null) => void;
  /** When true, tapping the active chip deselects it. Default: true */
  allowDeselect?: boolean;
  style?: ViewStyle;
}

export function ChipPicker<T extends string | number>({
  items,
  selected,
  onChange,
  allowDeselect = true,
  style,
}: ChipPickerProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.scroll, style]}>
      <View style={styles.row}>
        {items.map((item) => {
          const isSelected = selected === item.value;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => {
                if (isSelected && allowDeselect) {
                  onChange(null);
                } else {
                  onChange(item.value);
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
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
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
