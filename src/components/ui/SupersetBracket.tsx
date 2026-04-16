import React from 'react';
import { View, ViewStyle } from 'react-native';
import type { SupersetPosition } from '../../utils/superset';

const BAR_WIDTH = 3;
const BAR_COLOR = '#9B59B6';

interface SupersetBracketProps {
  position: SupersetPosition;
  children: React.ReactNode;
  /** Border radius of the content being wrapped — used to curve the bracket corners to match. */
  contentRadius?: number;
  /** Extra style applied to the outer wrapper (e.g. marginBottom to preserve spacing outside the bracket). */
  style?: ViewStyle;
}

export function SupersetBracket({ position, children, contentRadius = 0, style }: SupersetBracketProps) {
  if (!position) return <>{children}</>;

  return (
    <View style={[{
      borderLeftWidth: BAR_WIDTH,
      borderLeftColor: BAR_COLOR,
      borderTopLeftRadius: position === 'first' ? contentRadius : 0,
      borderBottomLeftRadius: position === 'last' ? contentRadius : 0,
    }, style]}>
      {children}
    </View>
  );
}
