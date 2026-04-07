import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { SupersetPosition } from '../../utils/superset';

const BAR_WIDTH = 4;
const BAR_COLOR = '#9B59B6';
const BAR_RADIUS = 6;

interface SupersetBracketProps {
  position: SupersetPosition;
  children: React.ReactNode;
}

export function SupersetBracket({ position, children }: SupersetBracketProps) {
  if (!position) return <>{children}</>;

  const showTop = position === 'middle' || position === 'last';
  const showBottom = position === 'middle' || position === 'first';

  const topRadius = position === 'first';
  const bottomRadius = position === 'last';

  return (
    <View style={styles.wrapper}>
      <View style={styles.barCol}>
        <View
          style={[
            styles.barHalf,
            showTop ? styles.barVisible : styles.barHidden,
            topRadius && styles.roundedTop,
          ]}
        />
        <View
          style={[
            styles.barHalf,
            showBottom ? styles.barVisible : styles.barHidden,
            bottomRadius && styles.roundedBottom,
          ]}
        />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  barCol: {
    width: BAR_WIDTH,
    marginRight: 6,
  },
  barHalf: {
    flex: 1,
  },
  barVisible: {
    backgroundColor: BAR_COLOR,
  },
  barHidden: {
    backgroundColor: 'transparent',
  },
  roundedTop: {
    borderTopLeftRadius: BAR_RADIUS,
    borderTopRightRadius: BAR_RADIUS,
  },
  roundedBottom: {
    borderBottomLeftRadius: BAR_RADIUS,
    borderBottomRightRadius: BAR_RADIUS,
  },
  content: {
    flex: 1,
  },
});
