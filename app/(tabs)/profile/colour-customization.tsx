import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useProfileStore } from '../../../src/stores/profile.store';
import { colors, fonts } from '../../../src/constants';
import { ColorPreferences } from '../../../src/models/profile';

const PRESET_COLORS = [
  '#FFFFFF', '#4CAF50', '#66BB6A', '#2196F3',
  '#42A5F5', '#FF5722', '#EF5350', '#9C27B0',
  '#AB47BC', '#FF9800', '#FFC107', '#009688',
  '#00BCD4',
];

const DEFAULTS: Required<ColorPreferences> = {
  setCompletion: '#4CAF50',
  accent: '#FFFFFF',
};

interface ColorSectionProps {
  label: string;
  value: string;
  defaultValue: string;
  previewType: 'row' | 'swatch';
  onSelect: (color: string) => void;
  onReset: () => void;
}

function ColorSection({ label, value, defaultValue, previewType, onSelect, onReset }: ColorSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {value !== defaultValue && (
          <TouchableOpacity onPress={onReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {previewType === 'row' ? (
        <View style={[styles.rowPreview, value !== 'transparent' && { backgroundColor: value }]}>
          <Text style={[styles.previewSetNum, value !== 'transparent' && { color: '#000000' }]}>1</Text>
          <Text style={[styles.previewPrev, value !== 'transparent' && { color: '#000000' }]}>50x10 @2</Text>
          <View style={styles.previewInput}><Text style={styles.previewInputText}>50</Text></View>
          <View style={styles.previewInput}><Text style={styles.previewInputText}>10</Text></View>
          <View style={[styles.previewInput, styles.previewRir]}><Text style={styles.previewInputText}>2</Text></View>
          <View style={styles.previewCheck}><Text style={styles.previewCheckText}>✓</Text></View>
        </View>
      ) : (
        <View style={styles.swatchPreviewRow}>
          <View style={[styles.swatchPreviewCircle, { backgroundColor: value === 'transparent' ? 'transparent' : value }]} />
          <Text style={styles.swatchPreviewHex}>{value === 'transparent' ? 'NONE' : value.toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.colorGrid}>
        <TouchableOpacity
          style={[
            styles.colorSwatch,
            styles.noneSwatch,
            value === 'transparent' && styles.colorSwatchSelected,
          ]}
          onPress={() => onSelect('transparent')}
          activeOpacity={0.7}
        >
          <Text style={styles.noneText}>NONE</Text>
        </TouchableOpacity>
        {PRESET_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              value.toUpperCase() === c.toUpperCase() && styles.colorSwatchSelected,
            ]}
            onPress={() => onSelect(c)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );
}

export default function ColourCustomizationScreen() {
  const { profile, updateProfile } = useProfileStore();
  const prefs = profile?.color_preferences ?? {};

  const [completion, setCompletion] = useState(prefs.setCompletion ?? DEFAULTS.setCompletion);
  const [accent, setAccent] = useState(prefs.accent ?? DEFAULTS.accent);

  useEffect(() => {
    if (profile?.color_preferences) {
      setCompletion(profile.color_preferences.setCompletion ?? DEFAULTS.setCompletion);
      setAccent(profile.color_preferences.accent ?? DEFAULTS.accent);
    }
  }, [profile]);

  const persistPreferences = async (nextCompletion: string, nextAccent: string) => {
    try {
      const current = profile?.color_preferences ?? {};
      const updated: ColorPreferences = {
        ...current,
        setCompletion: nextCompletion === DEFAULTS.setCompletion ? undefined : nextCompletion,
        accent: nextAccent === DEFAULTS.accent ? undefined : nextAccent,
      };
      const clean = Object.fromEntries(
        Object.entries(updated).filter(([, v]) => v !== undefined),
      );
      await updateProfile({ color_preferences: clean });
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleCompletionSelect = (next: string) => {
    setCompletion(next);
    void persistPreferences(next, accent);
  };

  const handleAccentSelect = (next: string) => {
    setAccent(next);
    void persistPreferences(completion, next);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <ColorSection
          label="Completion"
          value={completion}
          defaultValue={DEFAULTS.setCompletion}
          previewType="row"
          onSelect={handleCompletionSelect}
          onReset={() => handleCompletionSelect(DEFAULTS.setCompletion)}
        />

        <ColorSection
          label="Accent"
          value={accent}
          defaultValue={DEFAULTS.accent}
          previewType="swatch"
          onSelect={handleAccentSelect}
          onReset={() => handleAccentSelect(DEFAULTS.accent)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resetText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  rowPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 16,
  },
  previewSetNum: {
    width: 20,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  previewPrev: {
    width: 64,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.light,
  },
  previewInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  previewInputText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  previewRir: {
    maxWidth: 40,
  },
  previewCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCheckText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  swatchPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  swatchPreviewCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  swatchPreviewHex: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  noneSwatch: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },
});
