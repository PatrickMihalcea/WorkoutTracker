import { useEffect, useMemo, useState } from 'react';
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
import { fonts } from '../../../src/constants';
import { ColorPreferences } from '../../../src/models/profile';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { THEMES, type ThemeColors } from '../../../src/constants/themes';

const CARD_GAP = 12;
const SCREEN_PADDING = 24;
const NUM_COLS = 3;
const screenWidth = Dimensions.get('window').width;
const cardWidth =
  (screenWidth - SCREEN_PADDING * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      borderColor: colors.accent,
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

export default function ColourCustomizationScreen() {
  const { profile, updateProfile } = useProfileStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeId, setActiveId] = useState<string>(
    profile?.color_preferences?.themeId ?? 'default',
  );

  useEffect(() => {
    setActiveId(profile?.color_preferences?.themeId ?? 'default');
  }, [profile?.color_preferences?.themeId]);

  const handleThemeSelect = async (themeId: string) => {
    const previousId = activeId;
    setActiveId(themeId);

    try {
      const nextPreferences: ColorPreferences =
        themeId === 'default' ? {} : { themeId };
      await updateProfile({ color_preferences: nextPreferences });
    } catch (error: unknown) {
      setActiveId(previousId);
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
            const accentColor = theme.colors.accent;
            const accentDeepColor = theme.gradients.accent[1];

            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.card,
                  { width: cardWidth },
                  isActive && styles.cardActive,
                ]}
                onPress={() => handleThemeSelect(theme.id)}
                activeOpacity={0.75}
              >
                <View style={styles.swatchRow}>
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: theme.colors.accent,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: accentDeepColor,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
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
