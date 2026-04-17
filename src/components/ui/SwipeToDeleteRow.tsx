import React, { useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { fonts } from '../../constants';

interface SwipeToDeleteRowProps {
  onDelete: () => void;
  expandedHeight?: number;
  children: React.ReactNode;
  enabled?: boolean;
  onSwipeRight?: () => void;
}

export function SwipeToDeleteRow({
  onDelete,
  expandedHeight = 80,
  children,
  enabled = true,
  onSwipeRight,
}: SwipeToDeleteRowProps) {
  const swipeRef = useRef<Swipeable>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(1)).current;

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, expandedHeight],
  });

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    swipeRef.current?.close();
    if (direction === 'right') {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(heightAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
      ]).start(() => onDelete());
    } else if (direction === 'left' && onSwipeRight) {
      onSwipeRight();
    }
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [70, 0],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <Text style={styles.deleteText}>X</Text>
      </Animated.View>
    );
  };

  const renderLeftActions = onSwipeRight
    ? (progress: Animated.AnimatedInterpolation<number>) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-70, 0],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View style={[styles.warmupAction, { transform: [{ translateX }] }]}>
            <Text style={styles.warmupText}>W</Text>
          </Animated.View>
        );
      }
    : undefined;

  return (
    <Animated.View style={{ opacity: fadeAnim, maxHeight, overflow: 'hidden' as const }}>
      {enabled ? (
        <Swipeable
          ref={swipeRef}
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          onSwipeableOpen={handleSwipeOpen}
          rightThreshold={70}
          leftThreshold={70}
          overshootRight={false}
          overshootLeft={false}
          dragOffsetFromLeftEdge={onSwipeRight ? undefined : 10000}
          friction={2}
        >
          {children}
        </Swipeable>
      ) : (
        children
      )}
    </Animated.View>
  );
}

// These colors are semantic/fixed and not theme-dependent
const styles = StyleSheet.create({
  deleteAction: {
    width: 70,
    backgroundColor: '#cc3333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontSize: 18, fontFamily: fonts.bold },
  warmupAction: {
    width: 70,
    backgroundColor: '#FFD93D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warmupText: { color: '#000', fontSize: 18, fontFamily: fonts.bold },
});
