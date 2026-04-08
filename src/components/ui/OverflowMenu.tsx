import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  findNodeHandle,
  UIManager,
  Platform,
} from 'react-native';
import { colors, fonts } from '../../constants';

export interface OverflowMenuItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
}

export function OverflowMenu({ items }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const [anchorY, setAnchorY] = useState(0);
  const [anchorX, setAnchorX] = useState(0);
  const triggerRef = useRef<View>(null);

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
    <>
      <TouchableOpacity
        ref={triggerRef}
        onPress={handleOpen}
        style={styles.trigger}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
      >
        <Text style={styles.dots}>⋮</Text>
      </TouchableOpacity>
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
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    fontSize: 22,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    lineHeight: 24,
  },
  overlay: {
    flex: 1,
  },
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
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  menuItemDestructive: {
    color: '#FF6B6B',
  },
  menuItemDisabled: {
    color: colors.textMuted,
  },
});
