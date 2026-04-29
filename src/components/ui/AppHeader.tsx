import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { getHeaderTitle } from '@react-navigation/elements';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';
import { isLightTheme } from '../../constants/themes';

type HeaderButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AppHeaderButton({
  children,
  disabled = false,
  onPress,
  style,
}: HeaderButtonProps) {
  const { colors, theme } = useTheme();
  const isLight = isLightTheme(theme);

  const styles = useMemo(() => StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isLight ? colors.metricCardBackground : colors.surface,
      borderWidth: 1,
      borderColor: isLight ? colors.metricCardBorder : colors.border,
      shadowColor: isLight ? '#6B7280' : '#000000',
      shadowOpacity: isLight ? 0.12 : 0,
      shadowRadius: isLight ? 10 : 0,
      shadowOffset: isLight ? { width: 0, height: 4 } : { width: 0, height: 0 },
      elevation: isLight ? 2 : 0,
    },
    disabled: {
      opacity: 0.5,
    },
  }), [colors, isLight]);

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[styles.button, style, disabled && styles.disabled]}
    >
      {children}
    </TouchableOpacity>
  );
}

type BackButtonProps = {
  onPress?: () => void;
};

export function AppHeaderBackButton({ onPress }: BackButtonProps) {
  const { colors } = useTheme();

  return (
    <AppHeaderButton onPress={onPress}>
      <Ionicons name="chevron-back" size={24} color={colors.text} />
    </AppHeaderButton>
  );
}

export function AppHeader({
  back,
  navigation,
  options,
  route,
}: NativeStackHeaderProps) {
  const { colors, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const canGoBack = !!back && options.headerBackVisible !== false;
  const titleText = getHeaderTitle(options, route.name);
  const customLeft = options.headerLeft?.({
    tintColor: colors.text,
    canGoBack,
    label: back?.title,
    href: back?.href,
  });
  const customRight = options.headerRight?.({
    tintColor: colors.text,
    canGoBack,
  });
  const customTitle = typeof options.headerTitle === 'function'
    ? options.headerTitle({
        children: titleText,
        tintColor: colors.text,
      })
    : null;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: isLight ? colors.metricCardBorder : colors.border,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,
    },
    row: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    side: {
      width: 72,
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sideRight: {
      justifyContent: 'flex-end',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
    },
    title: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 20,
      textAlign: 'center',
    },
  }), [colors, isLight]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.side}>
          {customLeft !== undefined
            ? customLeft
            : canGoBack
              ? <AppHeaderBackButton onPress={() => navigation.goBack()} />
              : null}
        </View>
        <View style={styles.center}>
          {customTitle ?? (
            <Text numberOfLines={1} style={styles.title}>
              {titleText}
            </Text>
          )}
        </View>
        <View style={[styles.side, styles.sideRight]}>
          {customRight}
        </View>
      </View>
    </View>
  );
}
