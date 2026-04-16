import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { fonts } from '../../constants';
import {
  ChartMode,
  GranularityMode,
  TIME_RANGES,
  GRANULARITY_MODES,
} from './chartUtils';
import { useTheme } from '../../contexts/ThemeContext';

export interface ChartFilterBarProps {
  selectedRange: number;
  onChangeRange: (weeks: number) => void;
  chartMode: ChartMode;
  onChangeChartMode: (mode: ChartMode) => void;
  granularityMode: GranularityMode;
  onChangeGranularity: (mode: GranularityMode) => void;
}

export function TimeRangeDropdown({
  selected,
  onChange,
}: {
  selected: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const currentLabel = TIME_RANGES.find((r) => r.value === selected)?.label ?? 'All';

  const styles = useMemo(() => StyleSheet.create({
    dropdownTrigger: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownTriggerText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.text,
      marginRight: 4,
    },
    dropdownChevron: {
      fontSize: 12,
      color: colors.textMuted,
    },
    dropdownOverlay: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    dropdownMenu: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 4,
      minWidth: 180,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownItem: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    dropdownItemActive: {
      backgroundColor: colors.text,
    },
    dropdownItemText: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    dropdownItemTextActive: {
      color: colors.background,
    },
  }), [colors]);

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownTriggerText}>{currentLabel}</Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            {TIME_RANGES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.dropdownItem,
                  selected === r.value && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  onChange(r.value);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selected === r.value && styles.dropdownItemTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export function GranularityPicker({
  selected,
  onChange,
  isAll,
}: {
  selected: GranularityMode;
  onChange: (m: GranularityMode) => void;
  isAll?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    granularityRow: {
      flexDirection: 'row' as const,
      gap: 0,
      borderRadius: 10,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    granularityChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    granularityChipActive: {
      backgroundColor: colors.text,
    },
    granularityChipText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.textMuted,
    },
    granularityChipTextActive: {
      color: colors.background,
    },
  }), [colors]);

  const modes = isAll ? GRANULARITY_MODES.filter((m) => m.key !== 'W') : GRANULARITY_MODES;
  return (
    <View style={styles.granularityRow}>
      {modes.map((m) => (
        <TouchableOpacity
          key={m.key}
          style={[styles.granularityChip, selected === m.key && styles.granularityChipActive]}
          onPress={() => onChange(m.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.granularityChipText, selected === m.key && styles.granularityChipTextActive]}
          >
            {m.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ChartModeToggle({
  selected,
  onChange,
}: {
  selected: ChartMode;
  onChange: (m: ChartMode) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row' as const,
      backgroundColor: colors.surface,
      borderRadius: 8,
      overflow: 'hidden' as const,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    chipActive: {
      backgroundColor: colors.text,
    },
    chipText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },
    chipTextActive: {
      color: colors.background,
    },
  }), [colors]);

  return (
    <View style={styles.row}>
      {(['rel', 'abs'] as ChartMode[]).map((m) => (
        <TouchableOpacity
          key={m}
          style={[styles.chip, selected === m && styles.chipActive]}
          onPress={() => onChange(m)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, selected === m && styles.chipTextActive]}>
            {m === 'rel' ? 'Rel' : 'Abs'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ChartFilterBar({
  selectedRange,
  onChangeRange,
  chartMode,
  onChangeChartMode,
  granularityMode,
  onChangeGranularity,
}: ChartFilterBarProps) {
  return (
    <View style={filterBarStyles.filterBar}>
      <TimeRangeDropdown selected={selectedRange} onChange={onChangeRange} />
      <ChartModeToggle selected={chartMode} onChange={onChangeChartMode} />
      {chartMode === 'abs' && (
        <GranularityPicker
          selected={granularityMode}
          onChange={onChangeGranularity}
          isAll={selectedRange === 0}
        />
      )}
    </View>
  );
}

const filterBarStyles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
});
