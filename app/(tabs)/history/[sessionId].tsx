import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  Keyboard,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { sessionService } from '../../../src/services';
import { useProfileStore } from '../../../src/stores/profile.store';
import { Card, Input, Button } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import { SessionWithSetsAndExercises, SetLogWithExercise } from '../../../src/models';
import { formatDate, formatTime, formatDuration } from '../../../src/utils/date';
import { formatWeight, weightUnitLabel } from '../../../src/utils/units';

interface ExerciseGroup {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: SetLogWithExercise[];
}

function groupSetsByExercise(sets: SetLogWithExercise[]): ExerciseGroup[] {
  const map = new Map<string, ExerciseGroup>();

  for (const set of sets) {
    const existing = map.get(set.exercise_id);
    if (existing) {
      existing.sets.push(set);
    } else {
      map.set(set.exercise_id, {
        exerciseId: set.exercise_id,
        exerciseName: set.exercise?.name ?? 'Unknown',
        muscleGroup: set.exercise?.muscle_group ?? '',
        sets: [set],
      });
    }
  }

  return Array.from(map.values());
}

function computeDurationMinutes(startedAt: string, completedAt: string | null): number {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  return Math.max(0, Math.floor((end - start) / 60000));
}

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { profile } = useProfileStore();
  const weightUnit = profile?.weight_unit ?? 'kg';
  const [session, setSession] = useState<SessionWithSetsAndExercises | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState(new Date());
  const [editDuration, setEditDuration] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');

  const loadSession = async () => {
    if (!sessionId) return;
    try {
      const data = await sessionService.getByIdWithExercises(sessionId);
      setSession(data);
    } catch {
      // Handle quietly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const openEditModal = () => {
    if (!session) return;
    const start = new Date(session.started_at);
    setEditDate(start);
    setEditTime(start);
    setEditDuration(String(computeDurationMinutes(session.started_at, session.completed_at)));
    setShowDatePicker(Platform.OS === 'ios');
    setShowTimePicker(Platform.OS === 'ios');
    setShowEdit(true);
  };

  const endTime = useMemo(() => {
    const d = new Date(editDate);
    d.setHours(editTime.getHours(), editTime.getMinutes(), 0, 0);
    const mins = parseInt(editDuration, 10) || 0;
    return new Date(d.getTime() + mins * 60000);
  }, [editDate, editTime, editDuration]);

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setEditDate(date);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) setEditTime(date);
  };

  const handleSaveEdit = async () => {
    if (!session) return;
    const mins = parseInt(editDuration, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('Error', 'Duration must be a positive number');
      return;
    }

    const startedAt = new Date(editDate);
    startedAt.setHours(editTime.getHours(), editTime.getMinutes(), 0, 0);
    const completedAt = new Date(startedAt.getTime() + mins * 60000);

    try {
      await sessionService.updateSession(session.id, {
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
      });
      setShowEdit(false);
      setLoading(true);
      await loadSession();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const groups = groupSetsByExercise(session.sets);

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{formatDate(session.started_at)}</Text>
            <Text style={styles.time}>
              {formatTime(session.started_at)} · {formatDuration(session.started_at, session.completed_at)}
            </Text>
          </View>
          <TouchableOpacity onPress={openEditModal} style={styles.editBtn}>
            <Image source={require('../../../assets/icons/edit.png')} style={styles.editIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{groups.length}</Text>
            <Text style={styles.summaryLabel}>Exercises</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{session.sets.length}</Text>
            <Text style={styles.summaryLabel}>Total Sets</Text>
          </View>
        </View>

        {groups.map((group) => (
          <Card key={group.exerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{group.exerciseName}</Text>
              <Text style={styles.muscleGroup}>{group.muscleGroup}</Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, styles.colSet]}>SET</Text>
              <Text style={[styles.tableCol, styles.colWeight]}>{weightUnitLabel(weightUnit)}</Text>
              <Text style={[styles.tableCol, styles.colReps]}>REPS</Text>
              <Text style={[styles.tableCol, styles.colRir]}>RIR</Text>
            </View>

            {group.sets.map((set) => (
              <View key={set.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colSet]}>{set.set_number}</Text>
                <Text style={[styles.tableCell, styles.colWeight]}>{formatWeight(set.weight, weightUnit)}</Text>
                <Text style={[styles.tableCell, styles.colReps]}>{set.reps_performed}</Text>
                <Text style={[styles.tableCell, styles.colRir]}>
                  {set.rir !== null ? set.rir : '-'}
                </Text>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>

      <Modal visible={showEdit} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Session</Text>

              <Text style={styles.fieldLabel}>Date</Text>
              {Platform.OS === 'android' && (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {editDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
              {showDatePicker && (
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  themeVariant="dark"
                />
              )}

              <Text style={styles.fieldLabel}>Start Time</Text>
              {Platform.OS === 'android' && (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {editTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={editTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  themeVariant="dark"
                />
              )}

              <Input
                label="Duration (minutes)"
                value={editDuration}
                onChangeText={setEditDuration}
                keyboardType="number-pad"
                returnKeyType="done"
                blurOnSubmit
              />

              <View style={styles.endTimeRow}>
                <Text style={styles.fieldLabel}>End Time</Text>
                <Text style={styles.endTimeValue}>
                  {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setShowEdit(false)}
                />
                <Button title="Save" onPress={handleSaveEdit} />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  date: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    fontFamily: fonts.light,
    color: colors.textMuted,
  },
  editBtn: {
    padding: 8,
  },
  editIcon: {
    width: 22,
    height: 22,
    tintColor: colors.textSecondary,
  },
  summary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 4,
  },
  exerciseCard: {
    marginBottom: 16,
  },
  exerciseHeader: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  muscleGroup: {
    fontSize: 13,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCol: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
  },
  colSet: { width: 40 },
  colWeight: { flex: 1 },
  colReps: { flex: 1 },
  colRir: { width: 50 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 20,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },
  pickerButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  endTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  endTimeValue: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
