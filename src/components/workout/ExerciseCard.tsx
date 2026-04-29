import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import type { LayoutAnimationConfig } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { RoutineDayExercise, WorkoutRow, SetLog, WeightUnit, DistanceUnit } from '../../models';
import { fonts } from '../../constants';
import { isLightTheme } from '../../constants/themes';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/Card';
import { ExerciseIconPreview } from '../ui/ExerciseIconPreview';
import { SwipeToDeleteRow } from '../ui/SwipeToDeleteRow';
import { OverflowMenu } from '../ui/OverflowMenu';
import type { OverflowMenuItem } from '../ui/OverflowMenu';
import { SetRow } from './SetRow';
import { weightUnitLabel, distanceUnitLabel, formatWeight } from '../../utils/units';
import { getExerciseTypeConfig, getWeightLabel } from '../../utils/exerciseType';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getExercisePreviewUrl, getExerciseThumbnailUrl } from '../../utils/exerciseMedia';
import { EditableFieldKind } from '../set-editor/types';

const ANIM_DURATION = 300;
const EXERCISE_PLACEHOLDER = require('../../../assets/Setora-black-and-white.png');

const collapseLayout: LayoutAnimationConfig = {
  duration: 320,
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.88 },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

interface ExerciseCardProps {
  entry: RoutineDayExercise;
  rows: WorkoutRow[];
  previousSets: SetLog[];
  weightUnit: WeightUnit;
  distanceUnit?: DistanceUnit;
  onUpdateRowLocal?: (id: string, entryId: string, updates: Record<string, string>) => void;
  onUpdateRow: (id: string, entryId: string, updates: Record<string, string>) => void;
  onToggleRow: (id: string, entryId: string) => void;
  onDeleteRow: (id: string, entryId: string, setNumber: number) => void;
  onAddRow: (entryId: string, exerciseId: string) => void;
  onAddWarmup: (entryId: string, exerciseId: string) => void;
  onToggleWarmup: (id: string, entryId: string) => void;
  onRemove?: () => void;
  reorderCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLongPress?: () => void;
  supersetGroup?: string | null;
  canSupersetPrev?: boolean;
  canSupersetNext?: boolean;
  onSupersetPrev?: () => void;
  onSupersetNext?: () => void;
  onSeparate?: () => void;
  onSwap?: () => void;
  onDuplicate?: () => void;
  onDetails?: () => void;
  noBottomMargin?: boolean;
  demoOverflowVisible?: boolean;
  demoOverflowMenuStyle?: StyleProp<ViewStyle>;
  demoOverflowTriggerStyle?: StyleProp<ViewStyle>;
  activeCell?: { rowId: string; field: EditableFieldKind } | null;
  onBeginEditCell?: (rowId: string, field: EditableFieldKind) => void;
  onRowLayout?: (rowId: string, y: number) => void;
}

export function ExerciseCard({
  entry,
  rows,
  previousSets,
  weightUnit,
  distanceUnit = 'km',
  onUpdateRowLocal,
  onUpdateRow,
  onToggleRow,
  onDeleteRow,
  onAddRow,
  onAddWarmup,
  onToggleWarmup,
  onRemove,
  reorderCollapsed,
  isCollapsed,
  onToggleCollapse,
  onLongPress,
  supersetGroup,
  canSupersetPrev,
  canSupersetNext,
  onSupersetPrev,
  onSupersetNext,
  onSeparate,
  onSwap,
  onDuplicate,
  onDetails,
  noBottomMargin,
  demoOverflowVisible,
  demoOverflowMenuStyle,
  demoOverflowTriggerStyle,
  activeCell,
  onBeginEditCell,
  onRowLayout,
}: ExerciseCardProps) {
  const { colors, theme } = useTheme();
  const { setCompletion } = useThemeColors();
  const warmupActionColor = isLightTheme(theme) ? '#B8860B' : '#FFD93D';
  const exerciseName = entry.exercise?.name ?? 'Unknown Exercise';
  const muscleGroup = (entry.exercise?.muscle_group ?? '').replace(/_/g, ' ');
  const exType = entry.exercise?.exercise_type;
  const typeConfig = getExerciseTypeConfig(exType);
  const completedCount = rows.filter((r) => r.is_completed).length;
  const allDone = rows.length > 0 && rows.every((r) => r.is_completed);
  const templates = entry.sets ?? [];

  const sortedRows = useMemo(() => {
    const warmups = rows.filter((r) => r.is_warmup).sort((a, b) => a.set_number - b.set_number);
    const working = rows.filter((r) => !r.is_warmup).sort((a, b) => a.set_number - b.set_number);
    return [...warmups, ...working];
  }, [rows]);

  const completionAnim = useRef(new Animated.Value(allDone ? 1 : 0)).current;
  const prevAllDone = useRef(allDone);
  const didLongPressNameRef = useRef(false);

  const canAnimate = setCompletion !== 'transparent';
  const [thumbnailLoadFailed, setThumbnailLoadFailed] = useState(false);
  const [nameBlockWidth, setNameBlockWidth] = useState<number | null>(null);
  const [nameMaxWidth, setNameMaxWidth] = useState<number | null>(null);

  const thumbnailUri = useMemo(() => {
    return getExerciseThumbnailUrl(entry.exercise);
  }, [entry.exercise]);

  const previewUri = useMemo(() => getExercisePreviewUrl(entry.exercise), [entry.exercise]);

  const thumbnailSource: ImageSourcePropType = !thumbnailLoadFailed && thumbnailUri
    ? { uri: thumbnailUri }
    : EXERCISE_PLACEHOLDER;

  useEffect(() => {
    if (allDone === prevAllDone.current) return;
    prevAllDone.current = allDone;

    if (allDone && canAnimate) {
      LayoutAnimation.configureNext(collapseLayout);
      onToggleCollapse?.();
      Animated.timing(completionAnim, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    } else if (!allDone && canAnimate) {
      Animated.timing(completionAnim, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setThumbnailLoadFailed(false);
  }, [entry.exercise?.id, thumbnailUri]);

  useEffect(() => {
    setNameBlockWidth(null);
  }, [exerciseName]);

  /** Overlay that fades in over the card gradient when all sets are done. */
  const completionOverlay = canAnimate ? (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: setCompletion, opacity: completionAnim }]}
    />
  ) : null;

  const completedForegroundColor = isLightTheme(theme) ? '#FFFFFF' : '#000000';
  const defaultMenuTriggerColor = isLightTheme(theme) ? '#000000' : '#FFFFFF';
  const doneTextColor = (allDone && canAnimate) ? completedForegroundColor : undefined;
  const menuTriggerColor = allDone ? completedForegroundColor : defaultMenuTriggerColor;

  const handleToggle = () => {
    LayoutAnimation.configureNext(collapseLayout);
    onToggleCollapse?.();
  };

  const handleDetailsPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (didLongPressNameRef.current) {
      didLongPressNameRef.current = false;
      return;
    }
    onDetails?.();
  };

  const handleNameLongPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    didLongPressNameRef.current = true;
    onLongPress?.();
  };

  const handleNameLayout = (event: { nativeEvent: { lines: Array<{ width: number }> } }) => {
    const lines = event.nativeEvent.lines;
    if (!lines || lines.length === 0) return;
    const widest = Math.ceil(Math.max(...lines.map((line) => line.width)));
    setNameBlockWidth((prev) => (prev != null && Math.abs(prev - widest) < 1 ? prev : widest));
  };

  const handleNameContainerLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
    setNameMaxWidth((prev) => (prev != null && Math.abs(prev - nextWidth) < 1 ? prev : nextWidth));
  };

  const resolvedNameWidth = useMemo(() => {
    if (nameBlockWidth == null) return null;
    if (nameMaxWidth == null) return nameBlockWidth;
    return Math.min(nameBlockWidth, nameMaxWidth);
  }, [nameBlockWidth, nameMaxWidth]);

  const renderExerciseName = (done?: string) => {
    if (!onDetails) {
      return (
        <Text
          onTextLayout={handleNameLayout}
          style={[styles.exerciseName, done && { color: done }]}
        >
          {exerciseName}
        </Text>
      );
    }
    return (
      <Text
        onPress={handleDetailsPress}
        onLongPress={handleNameLongPress}
        onTextLayout={handleNameLayout}
        style={[styles.exerciseName, styles.exerciseNameLink, done && { color: done }]}
      >
        {exerciseName}
      </Text>
    );
  };

  const renderExerciseThumb = () => {
    return (
      <ExerciseIconPreview
        imageSource={thumbnailSource}
        previewUri={previewUri}
        imageStyle={styles.exerciseThumb}
        touchableStyle={styles.exerciseThumbTapTarget}
        onLongPress={onDetails ? handleNameLongPress : undefined}
        onImageError={() => setThumbnailLoadFailed(true)}
      />
    );
  };

  const menuItems = useMemo((): OverflowMenuItem[] => {
    const items: OverflowMenuItem[] = [];
    if (canSupersetPrev) items.push({ label: 'Superset Prev', onPress: () => onSupersetPrev?.() });
    if (canSupersetNext) items.push({ label: 'Superset Next', onPress: () => onSupersetNext?.() });
    if (supersetGroup) items.push({ label: 'Separate', onPress: () => onSeparate?.() });
    if (onSwap) items.push({ label: 'Swap', onPress: onSwap });
    if (onDuplicate) items.push({ label: 'Duplicate', onPress: onDuplicate });
    if (onRemove) items.push({ label: 'Delete', onPress: onRemove, destructive: true });
    return items;
  }, [supersetGroup, canSupersetPrev, canSupersetNext, onSupersetPrev, onSupersetNext, onSeparate, onSwap, onDuplicate, onRemove]);

  const showMenu = !reorderCollapsed && (onSwap || onDuplicate || onRemove || demoOverflowVisible);

  const marginOverride = noBottomMargin ? { marginBottom: 0 } : undefined;

  const styles = useMemo(() => StyleSheet.create({
    card: {
      marginBottom: 6,
      paddingVertical: 10,
    },
    cardCollapsed: {
      marginBottom: 6,
      paddingVertical: 10,
    },
    headerPressLayer: {
      position: 'relative',
      zIndex: 2000,
      elevation: 2000,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingBottom: 12,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerCollapsed: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: 'transparent',
      zIndex: 2100,
      elevation: 2100,
    },
    exerciseName: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.text,
      lineHeight: 22,
      includeFontPadding: false,
      flexShrink: 1,
      alignSelf: 'flex-start',
    },
    exerciseIdentity: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    exerciseThumb: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceLight,
    },
    exerciseThumbTapTarget: {
      borderRadius: 20,
    },
    exerciseIdentityText: {
      flex: 1,
      minWidth: 0,
      paddingRight: 10,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    nameTextBlock: {
      alignSelf: 'flex-start',
      flexShrink: 1,
      maxWidth: '100%',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginLeft: 8,
      flexShrink: 0,
    },
    exerciseNameLink: {
      color: colors.accent,
    },
    muscleGroup: {
      fontSize: 13,
      fontFamily: fonts.light,
      color: colors.textSecondary,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    setCount: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    columnHeaders: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 2,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 4,
    },
    colHeader: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    setLabelCol: { width: 28, alignItems: 'center', justifyContent: 'center' },
    previousCol: { width: 72, alignItems: 'center', justifyContent: 'center' },
    inputCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    rirCol: { width: 40, alignItems: 'center', justifyContent: 'center' },
    actionCol: { width: 32, marginLeft: 4 },
    addSetRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
      marginTop: 4,
    },
    addSetButton: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    addSetText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: fonts.semiBold,
    },
    addWarmupText: {
      color: warmupActionColor,
      fontSize: 14,
      fontFamily: fonts.semiBold,
    },
  }), [colors, warmupActionColor]);

  if (reorderCollapsed) {
    return (
      <SwipeToDeleteRow onDelete={() => onRemove?.()} expandedHeight={5000} enabled={false}>
        <Card style={[styles.cardCollapsed, marginOverride]}>
          {completionOverlay}
          <View style={styles.headerCollapsed}>
            <View style={styles.exerciseIdentity}>
              {renderExerciseThumb()}
              <View style={styles.exerciseIdentityText} onLayout={handleNameContainerLayout}>
                <View style={styles.nameRow}>
                  <View style={[styles.nameTextBlock, resolvedNameWidth ? { width: resolvedNameWidth } : null]}>
                    {renderExerciseName(doneTextColor)}
                  </View>
                </View>
                <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
                {completedCount}/{rows.length}
              </Text>
            </View>
          </View>
        </Card>
      </SwipeToDeleteRow>
    );
  }

  if (isCollapsed) {
    return (
      <SwipeToDeleteRow onDelete={() => onRemove?.()} expandedHeight={5000} enabled={false}>
        <Card style={[styles.cardCollapsed, marginOverride]}>
          {completionOverlay}
          <TouchableOpacity
            onPress={handleToggle}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.headerPressLayer}
          >
            <View style={styles.headerCollapsed}>
              <View style={styles.exerciseIdentity}>
                {renderExerciseThumb()}
                <View style={styles.exerciseIdentityText} onLayout={handleNameContainerLayout}>
                  <View style={styles.nameRow}>
                    <View style={[styles.nameTextBlock, resolvedNameWidth ? { width: resolvedNameWidth } : null]}>
                      {renderExerciseName(doneTextColor)}
                    </View>
                  </View>
                  <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
                  {completedCount}/{rows.length}
                </Text>
                {showMenu && (
                  <OverflowMenu
                    items={menuItems}
                    demoVisible={demoOverflowVisible}
                    demoMenuStyle={demoOverflowMenuStyle}
                    demoTriggerStyle={demoOverflowTriggerStyle}
                    triggerColor={menuTriggerColor}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Card>
      </SwipeToDeleteRow>
    );
  }

  let workingSetIndex = 0;

  const cardContent = (
    <Card style={[styles.card, marginOverride]}>
      {completionOverlay}
      <TouchableOpacity
        onPress={handleToggle}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        style={styles.headerPressLayer}
      >
        <View style={styles.header}>
          <View style={styles.exerciseIdentity}>
            {renderExerciseThumb()}
            <View style={styles.exerciseIdentityText} onLayout={handleNameContainerLayout}>
              <View style={styles.nameRow}>
                <View style={[styles.nameTextBlock, resolvedNameWidth ? { width: resolvedNameWidth } : null]}>
                  {renderExerciseName(doneTextColor)}
                </View>
              </View>
              <Text style={[styles.muscleGroup, doneTextColor && { color: doneTextColor }]}>{muscleGroup}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.setCount, doneTextColor && { color: doneTextColor }]}>
              {completedCount}/{rows.length}
            </Text>
            {showMenu && (
              <OverflowMenu
                items={menuItems}
                demoVisible={demoOverflowVisible}
                demoMenuStyle={demoOverflowMenuStyle}
                demoTriggerStyle={demoOverflowTriggerStyle}
                triggerColor={menuTriggerColor}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

        <View style={[styles.columnHeaders, doneTextColor && { borderBottomColor: '#000000' }]}>
          <View style={styles.setLabelCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>SET</Text>
          </View>
          <View style={styles.previousCol}>
            <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>PREV</Text>
          </View>
          {typeConfig.fields.map((f) => (
            <View key={f.key} style={styles.inputCol}>
              <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>
                {f.key === 'weight' ? getWeightLabel(exType, weightUnitLabel(weightUnit)) : f.key === 'distance' ? distanceUnitLabel(distanceUnit) : f.label}
              </Text>
            </View>
          ))}
          {typeConfig.showRir && (
            <View style={styles.rirCol}>
              <Text style={[styles.colHeader, doneTextColor && { color: doneTextColor }]}>RIR</Text>
            </View>
          )}
          <View style={styles.actionCol} />
        </View>

        {sortedRows.map((row) => {
          const displayNum = row.is_warmup ? 'W' : ++workingSetIndex;

          const origIndex = rows.indexOf(row);
          let suggestedWeight: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].weight) { suggestedWeight = rows[j].weight; break; }
          }
          if (!suggestedWeight && row.target_weight > 0) {
            suggestedWeight = formatWeight(row.target_weight, weightUnit);
          }

          let suggestedReps: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].reps) { suggestedReps = rows[j].reps; break; }
          }
          if (!suggestedReps && row.target_reps_min > 0) {
            suggestedReps = row.target_reps_min === row.target_reps_max
              ? String(row.target_reps_min)
              : `${row.target_reps_min}-${row.target_reps_max}`;
          }

          let suggestedDuration: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].duration) { suggestedDuration = rows[j].duration; break; }
          }
          if (!suggestedDuration && row.target_duration > 0) {
            suggestedDuration = String(row.target_duration);
          }

          let suggestedDistance: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].distance) { suggestedDistance = rows[j].distance; break; }
          }
          if (!suggestedDistance && row.target_distance > 0) {
            suggestedDistance = String(row.target_distance);
          }

          let suggestedRir: string | undefined;
          for (let j = origIndex - 1; j >= 0; j--) {
            if (rows[j].rir) { suggestedRir = rows[j].rir; break; }
          }

          return (
            <View
              key={row.id}
              onLayout={(event) => {
                onRowLayout?.(row.id, event.nativeEvent.layout.y);
              }}
            >
              <SetRow
                row={row}
                displaySetNumber={displayNum}
                previousSet={previousSets[origIndex]}
                weightUnit={weightUnit}
                distanceUnit={distanceUnit}
                exerciseType={exType}
                suggestedWeight={suggestedWeight}
                suggestedReps={suggestedReps}
                suggestedDuration={suggestedDuration}
                suggestedDistance={suggestedDistance}
                suggestedRir={suggestedRir}
                completionColor={setCompletion}
                onUpdateRowLocal={(updates) => onUpdateRowLocal?.(row.id, entry.id, updates)}
                onUpdateRow={(updates) => onUpdateRow(row.id, entry.id, updates)}
                onToggle={() => onToggleRow(row.id, entry.id)}
                onSwipeDelete={() => onDeleteRow(row.id, entry.id, row.set_number)}
                onToggleWarmup={() => onToggleWarmup(row.id, entry.id)}
                activeField={activeCell?.rowId === row.id ? activeCell.field : null}
                onBeginEdit={(field) => onBeginEditCell?.(row.id, field)}
              />
            </View>
          );
        })}

        <View style={styles.addSetRow}>
          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => onAddWarmup(entry.id, entry.exercise_id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.addWarmupText, doneTextColor && { color: doneTextColor }]}>+ Warmup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => onAddRow(entry.id, entry.exercise_id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.addSetText, doneTextColor && { color: doneTextColor }]}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
    </Card>
  );

  return (
    <SwipeToDeleteRow onDelete={() => onRemove?.()} expandedHeight={5000} enabled={false}>
      {cardContent}
    </SwipeToDeleteRow>
  );
}
