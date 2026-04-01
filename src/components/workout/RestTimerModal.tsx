import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors, fonts } from '../../constants';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

function buildOptions(): { value: number; label: string }[] {
  const items: { value: number; label: string }[] = [{ value: 0, label: 'Off' }];
  for (let s = 5; s <= 300; s += 5) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins === 0) {
      items.push({ value: s, label: `${secs}s` });
    } else {
      items.push({ value: s, label: `${mins}m ${secs}s` });
    }
  }
  return items;
}

const OPTIONS = buildOptions();

interface RestTimerModalProps {
  visible: boolean;
  currentValue: number;
  onSave: (seconds: number) => void;
  onClose: () => void;
}

export function RestTimerModal({ visible, currentValue, onSave, onClose }: RestTimerModalProps) {
  const [selected, setSelected] = useState(currentValue);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setSelected(currentValue);
      const idx = OPTIONS.findIndex((o) => o.value === currentValue);
      if (idx >= 0) {
        setTimeout(() => {
          listRef.current?.scrollToOffset({ offset: idx * ITEM_HEIGHT, animated: false });
        }, 100);
      }
    }
  }, [visible, currentValue]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, OPTIONS.length - 1));
    setSelected(OPTIONS[clamped].value);
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <Text style={styles.title}>Rest Timer</Text>

          <View style={[styles.pickerWrap, { height: ITEM_HEIGHT * VISIBLE_ITEMS }]}>
            <View style={styles.selectedHighlight} pointerEvents="none" />
            <FlatList
              ref={listRef}
              data={OPTIONS}
              keyExtractor={(item) => String(item.value)}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumEnd}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
              }}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              renderItem={({ item }) => {
                const isSelected = item.value === selected;
                return (
                  <View style={[styles.pickerItem, { height: ITEM_HEIGHT }]}>
                    <Text style={[styles.pickerText, isSelected && styles.pickerTextSelected]}>
                      {item.label}
                    </Text>
                  </View>
                );
              }}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerWrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  selectedHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  pickerTextSelected: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: {
    color: colors.background,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});
