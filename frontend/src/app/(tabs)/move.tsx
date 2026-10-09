import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import {
  createExerciseLog,
  getTodayExerciseLogs,
  type ExerciseLog,
} from '../../services/exerciseLogs';

import { sendTestNotification } from '../../services/notifications';

export default function MoveScreen() {
  const [workouts, setWorkouts] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [exerciseName, setExerciseName] = useState('');
  const [exerciseType, setExerciseType] = useState('Strength');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getTodayExerciseLogs();

      setWorkouts(data);
    } catch (error) {
      console.error('LOAD WORKOUTS ERROR:', error);

      Alert.alert(
        'Unable to load workouts',
        'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const totalExerciseMinutes = workouts.reduce(
    (total, workout) =>
      total + (workout.duration_minutes ?? 0),
    0
  );

  /*
   * These are temporary values.
   * We will connect them to Supabase/Health data later.
   */
  const steps = 0;
  const stepsTarget = 10000;

  const exerciseTarget = 45;

  const waterMl = 0;
  const waterTargetMl = 2800;

  const sleepHours = 0;
  const sleepTargetHours = 7.5;

  const stepsProgress = Math.min(
    steps / stepsTarget,
    1
  );

  const exerciseProgress = Math.min(
    totalExerciseMinutes / exerciseTarget,
    1
  );

  const waterProgress = Math.min(
    waterMl / waterTargetMl,
    1
  );

  const sleepProgress = Math.min(
    sleepHours / sleepTargetHours,
    1
  );

  async function handleSaveWorkout() {
    if (!exerciseName.trim()) {
      Alert.alert(
        'Workout name required',
        'Please enter the name of your workout.'
      );
      return;
    }

    const durationNumber = Number(duration);

    if (
      !duration.trim() ||
      !Number.isFinite(durationNumber) ||
      durationNumber <= 0
    ) {
      Alert.alert(
        'Invalid duration',
        'Please enter the workout duration in minutes.'
      );
      return;
    }

    const caloriesNumber = calories.trim()
      ? Number(calories)
      : undefined;

    if (
      calories.trim() &&
      (caloriesNumber === undefined ||
        !Number.isFinite(caloriesNumber) ||
        caloriesNumber < 0)
    ) {
      Alert.alert(
        'Invalid calories',
        'Please enter a valid calorie value.'
      );
      return;
    }

    try {
      setSaving(true);

      await createExerciseLog({
        exercise_name: exerciseName.trim(),
        exercise_type: exerciseType,
        duration_minutes: durationNumber,
        calories_burned: caloriesNumber,
        completed: true,
        notes: notes.trim() || undefined,
      });

      setExerciseName('');
      setExerciseType('Strength');
      setDuration('');
      setCalories('');
      setNotes('');

      setShowLogModal(false);

      await loadWorkouts();

      Alert.alert(
        'Workout saved',
        'Your workout has been added to today.'
      );
    } catch (error) {
      console.error('SAVE WORKOUT ERROR:', error);

      Alert.alert(
        'Unable to save workout',
        'Something went wrong. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function openQuickWorkout(type: string) {
    setExerciseType(type);

    if (type === 'Walking') {
      setExerciseName('Walking');
    } else if (type === 'Strength') {
      setExerciseName('Strength workout');
    } else if (type === 'Yoga') {
      setExerciseName('Yoga');
    } else {
      setExerciseName('');
    }

    setShowLogModal(true);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              TODAY
            </Text>

            <Text style={styles.title}>
              Move
            </Text>

            <Text style={styles.subtitle}>
              Small movements. Stronger you.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="fitness-outline"
              size={25}
              color="#B85C78"
            />
          </View>
        </View>

        {/* Main movement card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>
                TODAY'S MOVEMENT
              </Text>

              <Text style={styles.heroTitle}>
                Keep moving
              </Text>
            </View>

            <View style={styles.heroCircle}>
              <Ionicons
                name="walk-outline"
                size={28}
                color="#B85C78"
              />
            </View>
          </View>

          <Text style={styles.heroText}>
            Your movement target is based on your
            personalized AMORA plan.
          </Text>

          <View style={styles.heroStats}>
            <View>
              <Text style={styles.heroNumber}>
                {steps.toLocaleString()}
              </Text>

              <Text style={styles.heroSmall}>
                steps
              </Text>
            </View>

            <View style={styles.divider} />

            <View>
              <Text style={styles.heroNumber}>
                {totalExerciseMinutes}
              </Text>

              <Text style={styles.heroSmall}>
                active min
              </Text>
            </View>
          </View>
        </View>

        {/* Daily targets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Daily targets
          </Text>

          <Text style={styles.sectionHint}>
            Your personalized goals
          </Text>
        </View>

        <View style={styles.targetGrid}>
          <TargetCard
            icon="footsteps-outline"
            title="Steps"
            current={steps.toLocaleString()}
            target={stepsTarget.toLocaleString()}
            unit="steps"
            progress={stepsProgress}
          />

          <TargetCard
            icon="barbell-outline"
            title="Exercise"
            current={`${totalExerciseMinutes}`}
            target={`${exerciseTarget}`}
            unit="min"
            progress={exerciseProgress}
          />

          <TargetCard
            icon="water-outline"
            title="Water"
            current={(waterMl / 1000).toFixed(1)}
            target={(waterTargetMl / 1000).toFixed(1)}
            unit="L"
            progress={waterProgress}
          />

          <TargetCard
            icon="moon-outline"
            title="Sleep"
            current={`${sleepHours}`}
            target={`${sleepTargetHours}`}
            unit="hrs"
            progress={sleepProgress}
          />
        </View>

        {/* Today's workout */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Today's workout
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#B85C78" />

            <Text style={styles.loadingText}>
              Loading workouts...
            </Text>
          </View>
        ) : workouts.length === 0 ? (
          <View style={styles.workoutCard}>
            <View style={styles.workoutIcon}>
              <Ionicons
                name="flame-outline"
                size={25}
                color="#B85C78"
              />
            </View>

            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>
                No workout logged yet
              </Text>

              <Text style={styles.workoutSubtitle}>
                Log your workout to keep your progress
                updated.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            {workouts.map((workout) => (
              <View
                key={workout.id}
                style={styles.loggedWorkout}
              >
                <View style={styles.workoutIcon}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={25}
                    color="#B85C78"
                  />
                </View>

                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle}>
                    {workout.exercise_name}
                  </Text>

                  <Text style={styles.workoutSubtitle}>
                    {workout.exercise_type ?? 'Workout'}
                    {' • '}
                    {workout.duration_minutes ?? 0}
                    {' min'}
                    {workout.calories_burned != null
                      ? ` • ${workout.calories_burned} kcal`
                      : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Log workout */}
        <Pressable
          onPress={() => setShowLogModal(true)}
          style={({ pressed }) => [
            styles.logButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.logButtonText}>
            Log workout
          </Text>
        </Pressable>

        {/* Quick activities */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick activities
          </Text>

          <Text style={styles.sectionHint}>
            Choose what you did
          </Text>
        </View>

        <View style={styles.activityRow}>
          <ActivityButton
            icon="walk-outline"
            label="Walking"
            onPress={() =>
              openQuickWorkout('Walking')
            }
          />

          <ActivityButton
            icon="barbell-outline"
            label="Strength"
            onPress={() =>
              openQuickWorkout('Strength')
            }
          />

          <ActivityButton
            icon="body-outline"
            label="Yoga"
            onPress={() =>
              openQuickWorkout('Yoga')
            }
          />

          <ActivityButton
            icon="fitness-outline"
            label="Other"
            onPress={() =>
              openQuickWorkout('Other')
            }
          />
        </View>

        {/* Weekly movement */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            This week
          </Text>

          <Text style={styles.sectionHint}>
            Movement overview
          </Text>
        </View>

        <View style={styles.weekCard}>
          <WeekDay day="M" />
          <WeekDay day="T" />
          <WeekDay day="W" />
          <WeekDay day="T" />
          <WeekDay day="F" />
          <WeekDay day="S" />
          <WeekDay day="S" />
        </View>

        <Text style={styles.footerText}>
          Keep logging your movement. AMORA will use
          your activity history to show your progress.
        </Text>
      </ScrollView>

      {/* Log workout modal */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!saving) {
            setShowLogModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Log workout
                </Text>

                <Text style={styles.modalSubtitle}>
                  Add today's movement
                </Text>
              </View>

              <Pressable
                disabled={saving}
                onPress={() =>
                  setShowLogModal(false)
                }
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#6F5962"
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>
                Workout name
              </Text>

              <TextInput
                value={exerciseName}
                onChangeText={setExerciseName}
                placeholder="e.g. Evening walk"
                placeholderTextColor="#A8959C"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>
                Workout type
              </Text>

              <View style={styles.typeRow}>
                {[
                  'Walking',
                  'Strength',
                  'Yoga',
                  'Cardio',
                  'Other',
                ].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() =>
                      setExerciseType(type)
                    }
                    style={[
                      styles.typeButton,
                      exerciseType === type &&
                        styles.typeButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        exerciseType === type &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>
                Duration (minutes)
              </Text>

              <TextInput
                value={duration}
                onChangeText={setDuration}
                placeholder="e.g. 30"
                placeholderTextColor="#A8959C"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>
                Calories burned (optional)
              </Text>

              <TextInput
                value={calories}
                onChangeText={setCalories}
                placeholder="e.g. 180"
                placeholderTextColor="#A8959C"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>
                Notes (optional)
              </Text>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="How did it feel?"
                placeholderTextColor="#A8959C"
                multiline
                numberOfLines={3}
                style={[
                  styles.input,
                  styles.notesInput,
                ]}
              />

              <Pressable
                disabled={saving}
                onPress={handleSaveWorkout}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    !saving &&
                    styles.pressed,
                  saving && styles.disabledButton,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text style={styles.saveButtonText}>
                      Save workout
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type TargetCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  current: string;
  target: string;
  unit: string;
  progress: number;
};

function TargetCard({
  icon,
  title,
  current,
  target,
  unit,
  progress,
}: TargetCardProps) {
  return (
    <View style={styles.targetCard}>
      <View style={styles.targetIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#B85C78"
        />
      </View>

      <Text style={styles.targetTitle}>
        {title}
      </Text>

      <View style={styles.targetNumbers}>
        <Text style={styles.targetCurrent}>
          {current}
        </Text>

        <Text style={styles.targetUnit}>
          {unit}
        </Text>
      </View>

      <Text style={styles.targetGoal}>
        of {target} {unit}
      </Text>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

type ActivityButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function ActivityButton({
  icon,
  label,
  onPress,
}: ActivityButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.activityButton,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.activityIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#B85C78"
        />
      </View>

      <Text style={styles.activityLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function WeekDay({
  day,
}: {
  day: string;
}) {
  return (
    <View style={styles.weekDay}>
      <Text style={styles.weekDayLabel}>
        {day}
      </Text>

      <View style={styles.weekDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFF8FA',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#B85C78',
  },

  title: {
    marginTop: 3,
    fontSize: 32,
    fontWeight: '800',
    color: '#302229',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#806C75',
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBE8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCard: {
    backgroundColor: '#FBE8EE',
    borderRadius: 24,
    padding: 20,
    marginBottom: 26,
  },

  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#B85C78',
  },

  heroTitle: {
    marginTop: 4,
    fontSize: 23,
    fontWeight: '800',
    color: '#302229',
  },

  heroCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroText: {
    marginTop: 15,
    fontSize: 13,
    lineHeight: 19,
    color: '#705A64',
  },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },

  heroNumber: {
    fontSize: 25,
    fontWeight: '800',
    color: '#302229',
  },

  heroSmall: {
    marginTop: 2,
    fontSize: 12,
    color: '#806C75',
  },

  divider: {
    width: 1,
    height: 38,
    backgroundColor: '#E8C8D1',
    marginHorizontal: 30,
  },

  sectionHeader: {
    marginBottom: 12,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#302229',
  },

  sectionHint: {
    marginTop: 3,
    fontSize: 12,
    color: '#907A83',
  },

  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  targetCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F2E4E8',
  },

  targetIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FBE8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  targetTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#6F5962',
  },

  targetNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },

  targetCurrent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#302229',
  },

  targetUnit: {
    marginLeft: 4,
    fontSize: 11,
    color: '#806C75',
  },

  targetGoal: {
    marginTop: 2,
    fontSize: 11,
    color: '#9B858D',
  },

  progressTrack: {
    height: 6,
    backgroundColor: '#F2E4E8',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#B85C78',
    borderRadius: 3,
  },

  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2E4E8',
  },

  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#806C75',
  },

  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2E4E8',
  },

  loggedWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F2E4E8',
  },

  workoutIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FBE8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  workoutInfo: {
    flex: 1,
    marginLeft: 13,
  },

  workoutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#302229',
  },

  workoutSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#806C75',
  },

  logButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: '#B85C78',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 12,
  },

  logButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  notificationButton: {
    height: 50,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8C8D1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },

  notificationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '800',
    color: '#B85C78',
  },

  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  activityButton: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2E4E8',
  },

  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FBE8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityLabel: {
    marginTop: 7,
    fontSize: 10,
    fontWeight: '700',
    color: '#6F5962',
    textAlign: 'center',
  },

  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 17,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F2E4E8',
  },

  weekDay: {
    alignItems: 'center',
  },

  weekDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#806C75',
    marginBottom: 9,
  },

  weekDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5EEF0',
  },

  footerText: {
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 25,
    fontSize: 11,
    lineHeight: 17,
    color: '#9B858D',
  },

  pressed: {
    opacity: 0.75,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(48, 34, 41, 0.35)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFF8FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#302229',
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#806C75',
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2E4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    marginBottom: 7,
    marginTop: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#5F4A53',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDDE2',
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#302229',
  },

  notesInput: {
    minHeight: 85,
    paddingTop: 13,
    textAlignVertical: 'top',
  },

  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },

  typeButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F2E4E8',
  },

  typeButtonActive: {
    backgroundColor: '#B85C78',
  },

  typeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F5962',
  },

  typeButtonTextActive: {
    color: '#FFFFFF',
  },

  saveButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#B85C78',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  saveButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  disabledButton: {
    opacity: 0.7,
  },
});