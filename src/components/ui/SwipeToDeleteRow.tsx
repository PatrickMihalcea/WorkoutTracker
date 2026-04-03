import React, { useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, fonts } from '../../constants';

interface SwipeToDeleteRowProps {
  onDelete: () => void;
  expandedHeight?: number;
  children: React.ReactNode;
  enabled?: boolean;
}

export function SwipeToDeleteRow({
  onDelete,
  expandedHeight = 80,
  children,
  enabled = true,
}: SwipeToDeleteRowProps) {
  const swipeRef = useRef<Swipeable>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(1)).current;

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, expandedHeight],
  });

  const handleSwipeOpen = () => {
    swipeRef.current?.close();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
    ]).start(() => onDelete());
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

  return (
    <Animated.View style={{ opacity: fadeAnim, maxHeight, overflow: 'hidden' as const }}>
      {enabled ? (
        <Swipeable
          ref={swipeRef}
          renderRightActions={renderRightActions}
          onSwipeableOpen={handleSwipeOpen}
          rightThreshold={70}
          overshootRight={false}
          dragOffsetFromLeftEdge={10000}
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

const styles = StyleSheet.create({
  deleteAction: {
    width: 70,
    backgroundColor: '#cc3333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
});
