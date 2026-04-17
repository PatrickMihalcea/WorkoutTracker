import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  findNodeHandle,
  UIManager,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

export interface OverflowMenuItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  highlight?: boolean;
  disabled?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  demoVisible?: boolean;
  demoMenuStyle?: StyleProp<ViewStyle>;
  demoTriggerStyle?: StyleProp<ViewStyle>;
}

export function OverflowMenu({ items, demoVisible = false, demoMenuStyle, demoTriggerStyle }: OverflowMenuProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [anchorY, setAnchorY] = useState(0);
  const [anchorX, setAnchorX] = useState(0);
  const triggerRef = useRef<View>(null);
  const demoMenuMotionStyle = useMemo(() => {
    const flat = StyleSheet.flatten(demoMenuStyle);
    if (!flat) return undefined;
    const motion: ViewStyle = {};
    if (flat.opacity !== undefined) motion.opacity = flat.opacity;
    if (flat.transform) motion.transform = flat.transform;
    if (flat.top !== undefined) motion.top = flat.top;
    if (flat.right !== undefined) motion.right = flat.right;
    if (flat.bottom !== undefined) motion.bottom = flat.bottom;
    if (flat.left !== undefined) motion.left = flat.left;
    return motion;
  }, [demoMenuStyle]);

  const styles = useMemo(() => StyleSheet.create({
    trigger: { paddingHorizontal: 4, paddingVertical: 2, justifyContent: 'center', alignItems: 'center' },
    triggerInner: { justifyContent: 'center', alignItems: 'center' },
    dots: { fontSize: 22, color: colors.textSecondary, fontFamily: fonts.bold, lineHeight: 24 },
    overlay: { flex: 1 },
    menu: {
      position: 'absolute',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 4,
      minWidth: 180,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inlineMenu: {
      top: 30,
      right: 0,
      left: undefined,
      zIndex: 3000,
      elevation: 3000,
    },
    menuItem: { paddingVertical: 12, paddingHorizontal: 20 },
    menuItemText: { fontSize: 15, fontFamily: fonts.regular, color: colors.text },
    menuItemDestructive: { color: '#FF6B6B' },
    menuItemDisabled: { color: colors.textMuted },
    menuItemHighlight: { color: colors.accent },
  }), [colors]);

  const handleOpen = useCallback(() => {
    const node = findNodeHandle(triggerRef.current);
    if (node) {
      UIManager.measure(node, (_x, _y, width, height, pageX, pageY) => {
        setAnchorY(pageY + height + 4);
        setAnchorX(pageX + width);
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  }, []);

  const handleItemPress = useCallback((item: OverflowMenuItem) => {
    setOpen(false);
    requestAnimationFrame(() => item.onPress());
  }, []);

  return (
    <View style={{ position: 'relative' }} pointerEvents={demoVisible ? 'none' : 'auto'}>
      <TouchableOpacity
        ref={triggerRef}
        onPress={demoVisible ? undefined : handleOpen}
        style={styles.trigger}
        disabled={demoVisible}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
      >
        <Animated.View style={[styles.triggerInner, demoTriggerStyle]}>
          <Text style={styles.dots}>⋮</Text>
        </Animated.View>
      </TouchableOpacity>
      {demoVisible ? (
        <Animated.View style={[styles.menu, styles.inlineMenu, demoMenuMotionStyle]}>
          {items.map((item, i) => (
            <View key={i} style={styles.menuItem}>
              <Text
                style={[
                  styles.menuItemText,
                  item.destructive && styles.menuItemDestructive,
                  item.disabled && styles.menuItemDisabled,
                  item.highlight && styles.menuItemHighlight,
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </Animated.View>
      ) : (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
            <View
              style={[
                styles.menu,
                anchorY > 0 && { top: anchorY },
                anchorX > 0 && { right: Platform.select({ ios: undefined, default: undefined }), left: Math.max(8, anchorX - 180) },
              ]}
            >
              {items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuItem}
                  activeOpacity={item.disabled ? 1 : 0.7}
                  onPress={() => handleItemPress(item)}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      item.destructive && styles.menuItemDestructive,
                      item.disabled && styles.menuItemDisabled,
                      item.highlight && styles.menuItemHighlight,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
