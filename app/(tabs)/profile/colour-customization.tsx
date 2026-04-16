import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useProfileStore } from '../../../src/stores/profile.store';
import { colors, fonts } from '../../../src/constants';
import { ColorPreferences } from '../../../src/models/profile';

interface AppTheme {
  id: string;
  name: string;
  accent: string;
  setCompletion: string;
}

const THEMES: AppTheme[] = [
  {
    id: 'default',
    name: 'Default',
    accent: '#FFFFFF',
    setCompletion: '#4CAF50',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    accent: '#38CEC4',
    setCompletion: '#2196F3',
  },
  {
    id: 'fire',
    name: 'Fire',
    accent: '#FF7043',
    setCompletion: '#FF5722',
  },
  {
    id: 'forest',
    name: 'Forest',
    accent: '#66BB6A',
    setCompletion: '#26A69A',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    accent: '#CE93D8',
    setCompletion: '#7E57C2',
  },
  {
    id: 'gold',
    name: 'Gold',
    accent: '#FFD54F',
    setCompletion: '#FFA726',
  },
  {
    id: 'cherry',
    name: 'Cherry',
    accent: '#F48FB1',
    setCompletion: '#E91E63',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    accent: '#80DEEA',
    setCompletion: '#29B6F6',
  },
  {
    id: 'void',
    name: 'Void',
    accent: '#FFFFFF',
    setCompletion: 'transparent',
  },
];

const DEFAULTS: Required<Omit<ColorPreferences, 'themeId'>> = {
  setCompletion: '#4CAF50',
  accent: '#FFFFFF',
};

const CARD_GAP = 12;
const SCREEN_PADDING = 24;
const NUM_COLS = 3;
const screenWidth = Dimensions.get('window').width;
const cardWidth =
  (screenWidth - SCREEN_PADDING * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function ColourCustomizationScreen() {
  const { profile, updateProfile } = useProfileStore();
  const prefs = profile?.color_preferences ?? {};

  const [activeId, setActiveId] = useState<string>(prefs.themeId ?? 'default');

  useEffect(() => {
    setActiveId(profile?.color_preferences?.themeId ?? 'default');
  }, [profile]);

  const handleThemeSelect = async (theme: AppTheme) => {
    setActiveId(theme.id);
    try {
      const updated: ColorPreferences = {
        themeId: theme.id === 'default' ? undefined : theme.id,
        setCompletion:
          theme.setCompletion === DEFAULTS.setCompletion
            ? undefined
            : theme.setCompletion,
        accent:
          theme.accent === DEFAULTS.accent ? undefined : theme.accent,
      };
      const clean = Object.fromEntries(
        Object.entries(updated).filter(([, v]) => v !== undefined),
      ) as ColorPreferences;
      await updateProfile({ color_preferences: clean });
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentInner}
      >
        <Text style={styles.sectionLabel}>Themes</Text>
        <View style={styles.grid}>
          {THEMES.map((theme) => {
            const isActive = activeId === theme.id;
            const accentColor =
              theme.accent === 'transparent' ? colors.border : theme.accent;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.card,
                  { width: cardWidth },
                  isActive && styles.cardActive,
                ]}
                onPress={() => handleThemeSelect(theme)}
                activeOpacity={0.75}
              >
                <View style={styles.swatchRow}>
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor:
                          theme.accent === 'transparent'
                            ? 'transparent'
                            : theme.accent,
                        borderColor:
                          theme.accent === 'transparent'
                            ? colors.border
                            : 'transparent',
                        borderWidth: theme.accent === 'transparent' ? 1 : 0,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor:
                          theme.setCompletion === 'transparent'
                            ? 'transparent'
                            : theme.setCompletion,
                        borderColor:
                          theme.setCompletion === 'transparent'
                            ? colors.border
                            : 'transparent',
                        borderWidth:
                          theme.setCompletion === 'transparent' ? 1 : 0,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.themeName,
                    { color: isActive ? accentColor : colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {theme.name}
                </Text>
                {isActive && (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: accentColor },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  contentInner: {
    padding: SCREEN_PADDING,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'flex-start',
    minHeight: 90,
    justifyContent: 'space-between',
  },
  cardActive: {
    borderColor: colors.text,
    backgroundColor: colors.surfaceLight,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  themeName: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
