import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';

import { supabase } from '../../lib/supabase';
import { generatePersonalizedPlan } from '../../services/personalizedPlan';
import { saveNutritionTargets } from '../../services/saveNutritionTargets';

type Gender = 'female' | 'male' | 'other';

type GoalType =
  | 'lose_weight'
  | 'maintain_weight'
  | 'gain_weight';

type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'very_active';

type TargetData = {
  daily_calories: number | null;
  protein_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  water_ml: number | null;
  steps_target: number | null;
  exercise_minutes_target: number | null;
  sleep_hours_target: number | null;
  effective_date: string | null;
};

export default function YouScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingProfile, setEditingProfile] =
    useState(false);
  const [editingGoal, setEditingGoal] =
    useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] =
    useState<Gender>('female');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] =
    useState('');
  const [dailySteps, setDailySteps] =
    useState('');
  const [exerciseDays, setExerciseDays] =
    useState('');

  const [goalType, setGoalType] =
    useState<GoalType>('lose_weight');
  const [goalWeight, setGoalWeight] =
    useState('');
  const [targetDays, setTargetDays] =
    useState('');
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>('light');

  const [targets, setTargets] =
    useState<TargetData | null>(null);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      const today = getLocalDateString();

      const [
        profileResult,
        goalResult,
        targetResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'full_name, date_of_birth, height_cm, weight_kg, gender, average_daily_steps, exercise_days_per_week'
          )
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .from('goals')
          .select(
            'goal_type, target_weight_kg, target_days, activity_level'
          )
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', {
            ascending: false,
          })
          .limit(1)
          .maybeSingle(),

        supabase
          .from('nutrition_targets')
          .select(
            'daily_calories, protein_g, fiber_g, sugar_g, water_ml, steps_target, exercise_minutes_target, sleep_hours_target, effective_date'
          )
          .eq('user_id', user.id)
          .lte('effective_date', today)
          .order('effective_date', {
            ascending: false,
          })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileResult.error) {
        throw profileResult.error;
      }

      if (goalResult.error) {
        throw goalResult.error;
      }

      if (targetResult.error) {
        throw targetResult.error;
      }

      const profile = profileResult.data;
      const goal = goalResult.data;

      if (profile) {
        setName(profile.full_name ?? '');

        setHeight(
          profile.height_cm != null
            ? String(profile.height_cm)
            : ''
        );

        setCurrentWeight(
          profile.weight_kg != null
            ? String(profile.weight_kg)
            : ''
        );

        setDailySteps(
          profile.average_daily_steps != null
            ? String(
                profile.average_daily_steps
              )
            : ''
        );

        setExerciseDays(
          profile.exercise_days_per_week != null
            ? String(
                profile.exercise_days_per_week
              )
            : ''
        );

        if (
          profile.gender === 'female' ||
          profile.gender === 'male' ||
          profile.gender === 'other'
        ) {
          setGender(profile.gender);
        }

        if (profile.date_of_birth) {
          setAge(
            String(
              calculateAge(
                profile.date_of_birth
              )
            )
          );
        }
      }

      if (goal) {
        setGoalType(
          normalizeGoalType(goal.goal_type)
        );

        setGoalWeight(
          goal.target_weight_kg != null
            ? String(
                goal.target_weight_kg
              )
            : ''
        );

        setTargetDays(
          goal.target_days != null
            ? String(goal.target_days)
            : ''
        );

        if (
          goal.activity_level ===
            'sedentary' ||
          goal.activity_level === 'light' ||
          goal.activity_level === 'moderate' ||
          goal.activity_level ===
            'very_active'
        ) {
          setActivityLevel(
            goal.activity_level
          );
        }
      }

      setTargets(
        (targetResult.data as TargetData | null) ??
          null
      );
    } catch (error) {
      console.error(
        'LOAD YOU ERROR:',
        error
      );

      Alert.alert(
        'Could not load your profile',
        'We could not load your saved AMORA information.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPage();
    }, [loadPage])
  );

  const cancelEditing = () => {
    setEditingProfile(false);
    setEditingGoal(false);
    loadPage();
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const parsedAge = Number(age);
    const parsedHeight = Number(height);
    const parsedWeight =
      Number(currentWeight);

    const parsedSteps = dailySteps.trim()
      ? Number(dailySteps)
      : 0;

    const parsedExerciseDays =
      exerciseDays.trim()
        ? Number(exerciseDays)
        : 0;

    const parsedGoalWeight =
      goalType === 'maintain_weight'
        ? parsedWeight
        : Number(goalWeight);

    const parsedTargetDays =
      goalType === 'maintain_weight'
        ? 365
        : Number(targetDays);

    if (
      !name.trim() ||
      !Number.isFinite(parsedAge) ||
      parsedAge < 13 ||
      parsedAge > 120 ||
      !Number.isFinite(parsedHeight) ||
      parsedHeight < 100 ||
      parsedHeight > 230 ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight < 30 ||
      parsedWeight > 300
    ) {
      Alert.alert(
        'Check your details',
        'Please enter a valid name, age, height and current weight.'
      );
      return;
    }

    if (
      !Number.isFinite(parsedSteps) ||
      parsedSteps < 0 ||
      !Number.isFinite(
        parsedExerciseDays
      ) ||
      parsedExerciseDays < 0 ||
      parsedExerciseDays > 7
    ) {
      Alert.alert(
        'Check your activity',
        'Please enter valid steps and exercise days.'
      );
      return;
    }

    if (
      goalType !== 'maintain_weight' &&
      (
        !Number.isFinite(
          parsedGoalWeight
        ) ||
        parsedGoalWeight < 30 ||
        parsedGoalWeight > 300 ||
        !Number.isFinite(
          parsedTargetDays
        ) ||
        parsedTargetDays < 14 ||
        parsedTargetDays > 3650
      )
    ) {
      Alert.alert(
        'Check your goal',
        'Please enter a valid target weight and timeline.'
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'No authenticated user found.'
        );
      }

      const birthYear =
        new Date().getFullYear() -
        parsedAge;

      const dateOfBirth =
        `${birthYear}-01-01`;

      const {
        error: profileError,
      } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: name.trim(),
            date_of_birth: dateOfBirth,
            height_cm: parsedHeight,
            weight_kg: parsedWeight,
            gender,
            average_daily_steps:
              parsedSteps,
            exercise_days_per_week:
              parsedExerciseDays,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        );

      if (profileError) {
        throw profileError;
      }

      const {
        error: deactivateError,
      } = await supabase
        .from('goals')
        .update({
          is_active: false,
          updated_at:
            new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (deactivateError) {
        throw deactivateError;
      }

      const { error: goalError } =
        await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            goal_type: goalType,
            target_weight_kg:
              parsedGoalWeight,
            target_days:
              parsedTargetDays,
            activity_level:
              activityLevel,
            is_active: true,
          });

      if (goalError) {
        throw goalError;
      }

      const plan =
        await generatePersonalizedPlan({
          profile: {
            age: parsedAge,
            gender,
            height_cm: parsedHeight,
            current_weight_kg:
              parsedWeight,
            average_daily_steps:
              parsedSteps,
            exercise_days_per_week:
              parsedExerciseDays,
          },
          goal: {
            goal_type: goalType,
            target_weight_kg:
              parsedGoalWeight,
            target_days:
              parsedTargetDays,
            activity_level:
              activityLevel,
          },
        });

      const today =
        getLocalDateString();

      await saveNutritionTargets(
        plan,
        today
      );

      setTargets({
        daily_calories:
          plan.daily_calories,
        protein_g: plan.protein_g,
        fiber_g: plan.fiber_g,
        sugar_g: plan.sugar_g,
        water_ml: plan.water_ml,
        steps_target:
          plan.steps_target,
        exercise_minutes_target:
          plan.exercise_minutes_target,
        sleep_hours_target:
          plan.sleep_hours_target,
        effective_date: today,
      });

      setEditingProfile(false);
      setEditingGoal(false);

      Alert.alert(
        'AMORA updated ✨',
        'Your profile and daily targets have been recalculated.'
      );
    } catch (error) {
      console.error(
        'SAVE YOU ERROR:',
        error
      );

      Alert.alert(
        'Could not update AMORA',
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating your plan.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out of AMORA?',
      'You can sign back in anytime.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            const { error } =
              await supabase.auth.signOut();

            if (error) {
              Alert.alert(
                'Could not sign out',
                'Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingLogo}>
          <Text
            style={styles.loadingLogoText}
          >
            A
          </Text>
        </View>

        <Text style={styles.loadingTitle}>
          AMORA
        </Text>

        <ActivityIndicator
          color="#9B4F70"
          style={{ marginTop: 16 }}
        />

        <Text style={styles.loadingText}>
          Loading your space...
        </Text>
      </View>
    );
  }

  const displayName =
    name.trim() || 'there';

  return (
    <View style={styles.container}>
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>
              YOUR AMORA SPACE
            </Text>

            <Text style={styles.title}>
              Hey, {displayName} ✨
            </Text>

            <Text style={styles.subtitle}>
              Everything AMORA knows about
              you,
              {'\n'}
              in one place.
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitial(displayName)}
            </Text>
          </View>
        </View>

        <SectionHeader
          title="About you"
          onEdit={() =>
            setEditingProfile(true)
          }
          hidden={editingProfile}
        />

        {editingProfile ? (
          <ProfileEditor
            name={name}
            age={age}
            gender={gender}
            height={height}
            currentWeight={
              currentWeight
            }
            dailySteps={dailySteps}
            exerciseDays={exerciseDays}
            setName={setName}
            setAge={setAge}
            setGender={setGender}
            setHeight={setHeight}
            setCurrentWeight={
              setCurrentWeight
            }
            setDailySteps={
              setDailySteps
            }
            setExerciseDays={
              setExerciseDays
            }
          />
        ) : (
          <View style={styles.card}>
            <View style={styles.profileTop}>
              <View
                style={styles.largeAvatar}
              >
                <Text
                  style={
                    styles.largeAvatarText
                  }
                >
                  {getInitial(
                    displayName
                  )}
                </Text>
              </View>

              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={
                    styles.profileName
                  }
                >
                  {displayName}
                </Text>

                <Text
                  style={
                    styles.profileMeta
                  }
                >
                  {age || '—'} years •{' '}
                  {formatGender(gender)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <MiniStat
                label="Height"
                value={
                  height
                    ? `${height} cm`
                    : '—'
                }
              />

              <MiniStat
                label="Weight"
                value={
                  currentWeight
                    ? `${currentWeight} kg`
                    : '—'
                }
              />

              <MiniStat
                label="Steps"
                value={
                  dailySteps
                    ? Number(
                        dailySteps
                      ).toLocaleString()
                    : '—'
                }
              />
            </View>
          </View>
        )}

        {!editingProfile && (
          <>
            <SectionHeader
              title="Your goal"
              onEdit={() =>
                setEditingGoal(true)
              }
              hidden={editingGoal}
            />

            {editingGoal ? (
              <GoalEditor
                goalType={goalType}
                goalWeight={
                  goalWeight
                }
                targetDays={
                  targetDays
                }
                activityLevel={
                  activityLevel
                }
                setGoalType={
                  setGoalType
                }
                setGoalWeight={
                  setGoalWeight
                }
                setTargetDays={
                  setTargetDays
                }
                setActivityLevel={
                  setActivityLevel
                }
              />
            ) : (
              <GoalCard
                goalType={goalType}
                goalWeight={
                  goalWeight
                }
                currentWeight={
                  currentWeight
                }
                targetDays={
                  targetDays
                }
                activityLevel={
                  activityLevel
                }
              />
            )}
          </>
        )}

        {(editingProfile ||
          editingGoal) && (
          <View
            style={styles.actionRow}
          >
            <Pressable
              style={
                styles.cancelButton
              }
              onPress={
                cancelEditing
              }
              disabled={saving}
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.saveButton,
                saving && {
                  opacity: 0.65,
                },
              ]}
              onPress={
                handleSave
              }
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.saveText
                  }
                >
                  Save & update plan
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View
          style={styles.sectionHeader}
        >
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Your AMORA targets
            </Text>

            <Text
              style={styles.sectionHint}
            >
              Personalized from your
              current profile
            </Text>
          </View>
        </View>

        {targets ? (
          <View style={styles.card}>
            <TargetRow
              icon="◉"
              label="Daily calories"
              value={
                targets.daily_calories !=
                null
                  ? `${Math.round(
                      targets.daily_calories
                    )} kcal`
                  : '—'
              }
            />

            <TargetRow
              icon="P"
              label="Protein"
              value={
                targets.protein_g != null
                  ? `${Math.round(
                      targets.protein_g
                    )} g`
                  : '—'
              }
            />

            <TargetRow
              icon="F"
              label="Fiber"
              value={
                targets.fiber_g != null
                  ? `${Math.round(
                      targets.fiber_g
                    )} g`
                  : '—'
              }
            />

            <TargetRow
              icon="W"
              label="Water"
              value={
                targets.water_ml != null
                  ? `${formatLitres(
                      targets.water_ml
                    )} L`
                  : '—'
              }
            />

            <TargetRow
              icon="↗"
              label="Steps"
              value={
                targets.steps_target !=
                null
                  ? Math.round(
                      targets.steps_target
                    ).toLocaleString()
                  : '—'
              }
            />

            <TargetRow
              icon="◆"
              label="Exercise"
              value={
                targets.exercise_minutes_target !=
                null
                  ? `${Math.round(
                      targets.exercise_minutes_target
                    )} min`
                  : '—'
              }
            />

            <TargetRow
              icon="Z"
              label="Sleep"
              value={
                targets.sleep_hours_target !=
                null
                  ? `${Number(
                      targets.sleep_hours_target
                    ).toFixed(1)} hrs`
                  : '—'
              }
              last
            />

            {targets.effective_date ? (
              <Text
                style={styles.targetDate}
              >
                Plan active from{' '}
                {formatDate(
                  targets.effective_date
                )}
              </Text>
            ) : null}
          </View>
        ) : (
          <View
            style={styles.emptyCard}
          >
            <Text
              style={styles.emptyIcon}
            >
              ✨
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              Your personalized plan
            </Text>

            <Text
              style={styles.emptyText}
            >
              Complete your profile to
              create personalized daily
              targets.
            </Text>
          </View>
        )}

        {!editingProfile &&
          !editingGoal && (
            <Pressable
              style={
                styles.updateCard
              }
              onPress={() =>
                setEditingProfile(
                  true
                )
              }
            >
              <View
                style={
                  styles.updateIcon
                }
              >
                <Text
                  style={
                    styles.updateIconText
                  }
                >
                  ↻
                </Text>
              </View>

              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={
                    styles.updateTitle
                  }
                >
                  Weight changed?
                </Text>

                <Text
                  style={
                    styles.updateText
                  }
                >
                  Update your weight or
                  activity and AMORA will
                  recalculate your plan.
                </Text>
              </View>

              <Text
                style={
                  styles.updateArrow
                }
              >
                →
              </Text>
            </Pressable>
          )}

        <Pressable
          style={
            styles.signOutButton
          }
          onPress={
            handleSignOut
          }
        >
          <View
            style={
              styles.signOutIcon
            }
          >
            <Text
              style={
                styles.signOutIconText
              }
            >
              ↪
            </Text>
          </View>

          <View
            style={{ flex: 1 }}
          >
            <Text
              style={
                styles.signOutTitle
              }
            >
              Sign out
            </Text>

            <Text
              style={
                styles.signOutSubtitle
              }
            >
              Sign out of your AMORA
              account
            </Text>
          </View>

          <Text
            style={
              styles.signOutArrow
            }
          >
            →
          </Text>
        </Pressable>

        <View style={styles.note}>
          <Text
            style={styles.noteIcon}
          >
            ✦
          </Text>

          <Text
            style={styles.noteText}
          >
            AMORA uses wellness estimates
            to personalize your experience.
            Your targets are not medical
            advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  title,
  onEdit,
  hidden = false,
}: {
  title: string;
  onEdit: () => void;
  hidden?: boolean;
}) {
  return (
    <View
      style={styles.sectionHeader}
    >
      <Text
        style={styles.sectionTitle}
      >
        {title}
      </Text>

      {!hidden && (
        <Pressable
          style={styles.editButton}
          onPress={onEdit}
        >
          <Text
            style={styles.editText}
          >
            Edit
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function ProfileEditor({
  name,
  age,
  gender,
  height,
  currentWeight,
  dailySteps,
  exerciseDays,
  setName,
  setAge,
  setGender,
  setHeight,
  setCurrentWeight,
  setDailySteps,
  setExerciseDays,
}: any) {
  return (
    <View
      style={styles.editorCard}
    >
      <Input
        label="Name"
        value={name}
        placeholder="Your name"
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Input
        label="Age"
        value={age}
        placeholder="24"
        onChangeText={(value: string) =>
          setAge(
            value.replace(
              /[^0-9]/g,
              ''
            )
          )
        }
        keyboardType="number-pad"
      />

      <Text
        style={styles.editorLabel}
      >
        Gender
      </Text>

      <View
        style={styles.optionRow}
      >
        {(
          [
            'female',
            'male',
            'other',
          ] as Gender[]
        ).map((item) => (
          <Option
            key={item}
            label={formatGender(
              item
            )}
            selected={
              gender === item
            }
            onPress={() =>
              setGender(item)
            }
          />
        ))}
      </View>

      <View
        style={styles.twoColumn}
      >
        <Input
          label="Height"
          value={height}
          placeholder="160"
          suffix="cm"
          onChangeText={(value: string) =>
            setHeight(
              value.replace(
                /[^0-9.]/g,
                ''
              )
            )
          }
          keyboardType="decimal-pad"
        />

        <Input
          label="Current weight"
          value={
            currentWeight
          }
          placeholder="72"
          suffix="kg"
          onChangeText={(value: string) =>
            setCurrentWeight(
              value.replace(
                /[^0-9.]/g,
                ''
              )
            )
          }
          keyboardType="decimal-pad"
        />
      </View>

      <View
        style={styles.twoColumn}
      >
        <Input
          label="Average steps"
          value={dailySteps}
          placeholder="8000"
          suffix="steps"
          onChangeText={(value: string) =>
            setDailySteps(
              value.replace(
                /[^0-9]/g,
                ''
              )
            )
          }
          keyboardType="number-pad"
        />

        <Input
          label="Exercise days"
          value={exerciseDays}
          placeholder="4"
          suffix="/ week"
          onChangeText={(value: string) =>
            setExerciseDays(
              value.replace(
                /[^0-9]/g,
                ''
              )
            )
          }
          keyboardType="number-pad"
        />
      </View>
    </View>
  );
}

function GoalEditor({
  goalType,
  goalWeight,
  targetDays,
  activityLevel,
  setGoalType,
  setGoalWeight,
  setTargetDays,
  setActivityLevel,
}: any) {
  return (
    <View
      style={styles.editorCard}
    >
      <Text
        style={styles.editorLabel}
      >
        Goal
      </Text>

      {(
        [
          [
            'lose_weight',
            'Lose weight',
          ],
          [
            'maintain_weight',
            'Maintain weight',
          ],
          [
            'gain_weight',
            'Gain weight',
          ],
        ] as [
          GoalType,
          string
        ][]
      ).map(
        ([value, label]) => (
          <Option
            key={value}
            label={label}
            selected={
              goalType === value
            }
            onPress={() =>
              setGoalType(value)
            }
            fullWidth
          />
        )
      )}

      {goalType !==
        'maintain_weight' && (
        <View
          style={styles.twoColumn}
        >
          <Input
            label="Target weight"
            value={
              goalWeight
            }
            placeholder="62"
            suffix="kg"
            onChangeText={(value: string) =>
              setGoalWeight(
                value.replace(
                  /[^0-9.]/g,
                  ''
                )
              )
            }
            keyboardType="decimal-pad"
          />

          <Input
            label="Timeline"
            value={
              targetDays
            }
            placeholder="120"
            suffix="days"
            onChangeText={(value: string) =>
              setTargetDays(
                value.replace(
                  /[^0-9]/g,
                  ''
                )
              )
            }
            keyboardType="number-pad"
          />
        </View>
      )}

      <Text
        style={styles.editorLabel}
      >
        Activity level
      </Text>

      {(
        [
          [
            'sedentary',
            'Mostly sitting',
            'Little structured activity',
          ],
          [
            'light',
            'Lightly active',
            'Walking + light exercise',
          ],
          [
            'moderate',
            'Moderately active',
            'Regular exercise',
          ],
          [
            'very_active',
            'Very active',
            'Frequent intense activity',
          ],
        ] as [
          ActivityLevel,
          string,
          string
        ][]
      ).map(
        ([
          value,
          title,
          description,
        ]) => (
          <Pressable
            key={value}
            style={[
              styles.activityOption,
              activityLevel ===
                value &&
                styles.activityOptionSelected,
            ]}
            onPress={() =>
              setActivityLevel(
                value
              )
            }
          >
            <View
              style={[
                styles.radio,
                activityLevel ===
                  value &&
                  styles.radioSelected,
              ]}
            >
              {activityLevel ===
                value && (
                <View
                  style={
                    styles.radioDot
                  }
                />
              )}
            </View>

            <View
              style={{ flex: 1 }}
            >
              <Text
                style={
                  styles.activityTitle
                }
              >
                {title}
              </Text>

              <Text
                style={
                  styles.activityDescription
                }
              >
                {description}
              </Text>
            </View>
          </Pressable>
        )
      )}
    </View>
  );
}

function GoalCard({
  goalType,
  goalWeight,
  currentWeight,
  targetDays,
  activityLevel,
}: {
  goalType: GoalType;
  goalWeight: string;
  currentWeight: string;
  targetDays: string;
  activityLevel: ActivityLevel;
}) {
  const title =
    goalType === 'lose_weight'
      ? 'Lose weight'
      : goalType === 'gain_weight'
        ? 'Gain weight'
        : 'Maintain weight';

  const icon =
    goalType === 'lose_weight'
      ? '↓'
      : goalType === 'gain_weight'
        ? '↑'
        : '→';

  return (
    <View style={styles.card}>
      <View
        style={styles.goalIcon}
      >
        <Text
          style={styles.goalIconText}
        >
          {icon}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          marginLeft: 13,
        }}
      >
        <Text
          style={styles.goalTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.goalSubtitle}
        >
          {goalType ===
          'maintain_weight'
            ? 'Building healthy consistency'
            : `${currentWeight || '—'} kg → ${
                goalWeight || '—'
              } kg`}
        </Text>

        <View
          style={styles.pillRow}
        >
          {targetDays ? (
            <View
              style={styles.pill}
            >
              <Text
                style={styles.pillText}
              >
                {targetDays} days
              </Text>
            </View>
          ) : null}

          <View
            style={styles.pill}
          >
            <Text
              style={styles.pillText}
            >
              {formatActivity(
                activityLevel
              )}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function TargetRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.targetRow,
        !last &&
          styles.targetBorder,
      ]}
    >
      <View
        style={styles.targetIcon}
      >
        <Text
          style={
            styles.targetIconText
          }
        >
          {icon}
        </Text>
      </View>

      <Text
        style={styles.targetLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.targetValue}
      >
        {value}
      </Text>
    </View>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Text
        style={styles.miniValue}
      >
        {value}
      </Text>

      <Text
        style={styles.miniLabel}
      >
        {label}
      </Text>
    </View>
  );
}

function Input({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
  suffix,
  autoCapitalize = 'none',
}: any) {
  return (
    <View
      style={{
        flex: 1,
        marginBottom: 13,
      }}
    >
      <Text
        style={styles.editorLabel}
      >
        {label}
      </Text>

      <View
        style={styles.inputWrapper}
      >
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#B9A4AD"
          onChangeText={onChangeText}
          keyboardType={
            keyboardType
          }
          autoCapitalize={
            autoCapitalize
          }
          autoCorrect={false}
        />

        {suffix ? (
          <Text
            style={styles.suffix}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Option({
  label,
  selected,
  onPress,
  fullWidth = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.option,
        fullWidth &&
          styles.optionFull,
        selected &&
          styles.optionSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionText,
          selected &&
            styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>

      {selected && (
        <View
          style={styles.check}
        >
          <Text
            style={styles.checkText}
          >
            ✓
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function normalizeGoalType(
  value: string | null
): GoalType {
  if (
    value === 'gain_weight' ||
    value === 'weight_gain'
  ) {
    return 'gain_weight';
  }

  if (
    value === 'maintain_weight'
  ) {
    return 'maintain_weight';
  }

  return 'lose_weight';
}

function calculateAge(
  date: string
) {
  const birth = new Date(date);
  const today = new Date();

  let result =
    today.getFullYear() -
    birth.getFullYear();

  const month =
    today.getMonth() -
    birth.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() <
        birth.getDate())
  ) {
    result -= 1;
  }

  return result;
}

function getLocalDateString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1
    ).padStart(2, '0'),
    String(
      now.getDate()
    ).padStart(2, '0'),
  ].join('-');
}

function getInitial(
  name: string
) {
  return (
    name
      .trim()
      .charAt(0)
      .toUpperCase() || 'A'
  );
}

function formatGender(
  gender: Gender
) {
  if (gender === 'female') {
    return 'Female';
  }

  if (gender === 'male') {
    return 'Male';
  }

  return 'Other';
}

function formatActivity(
  value: ActivityLevel
) {
  if (value === 'sedentary') {
    return 'Mostly sitting';
  }

  if (value === 'light') {
    return 'Lightly active';
  }

  if (value === 'moderate') {
    return 'Moderately active';
  }

  return 'Very active';
}

function formatLitres(
  ml: number
) {
  return (
    Math.round(
      (ml / 1000) * 10
    ) / 10
  );
}

function formatDate(
  date: string
) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FFF8FA',
      overflow: 'hidden',
    },

    content: {
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 40,
    },

    blobOne: {
      position:
        'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor:
        '#F6DCE7',
      top: -100,
      right: -80,
      opacity: 0.65,
    },

    blobTwo: {
      position:
        'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor:
        '#EEDCE8',
      bottom: -70,
      left: -70,
      opacity: 0.45,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 25,
    },

    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2,
      color: '#A65A7B',
      marginBottom: 7,
    },

    title: {
      fontSize: 29,
      lineHeight: 35,
      fontWeight: '800',
      color: '#302229',
    },

    subtitle: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: '#79646D',
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#F2D6E2',
      marginLeft: 12,
    },

    avatarText: {
      fontSize: 19,
      fontWeight: '800',
      color: '#8E4566',
    },

    sectionHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginTop: 22,
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: '#302229',
    },

    sectionHint: {
      marginTop: 3,
      fontSize: 10.5,
      color: '#9A858D',
    },

    editButton: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor:
        '#F8E7EE',
    },

    editText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#8E4566',
    },

    card: {
      padding: 17,
      borderRadius: 22,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#F0DEE5',
    },

    profileTop: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    largeAvatar: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#F8E7EE',
      marginRight: 13,
    },

    largeAvatarText: {
      fontSize: 21,
      fontWeight: '800',
      color: '#8E4566',
    },

    profileName: {
      fontSize: 17,
      fontWeight: '800',
      color: '#3B2A32',
    },

    profileMeta: {
      marginTop: 4,
      fontSize: 11,
      color: '#8F7A83',
    },

    divider: {
      height: 1,
      backgroundColor:
        '#F2E5EA',
      marginVertical: 16,
    },

    statsRow: {
      flexDirection:
        'row',
    },

    miniStat: {
      flex: 1,
      alignItems:
        'center',
    },

    miniValue: {
      fontSize: 13,
      fontWeight: '800',
      color: '#4B3740',
    },

    miniLabel: {
      marginTop: 4,
      fontSize: 10,
      color: '#9A858D',
    },

    goalIcon: {
      width: 49,
      height: 49,
      borderRadius: 16,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#F8E7EE',
    },

    goalIconText: {
      fontSize: 23,
      fontWeight: '800',
      color: '#9B4F70',
    },

    goalTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#45323B',
    },

    goalSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: '#857079',
    },

    pillRow: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 6,
      marginTop: 8,
    },

    pill: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor:
        '#FDF1F5',
    },

    pillText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: '#8E4566',
    },

    targetRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      minHeight: 57,
    },

    targetBorder: {
      borderBottomWidth: 1,
      borderBottomColor:
        '#F2E5EA',
    },

    targetIcon: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#F8E7EE',
      marginRight: 11,
    },

    targetIconText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#9B4F70',
    },

    targetLabel: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: '#65515A',
    },

    targetValue: {
      fontSize: 13,
      fontWeight: '800',
      color: '#3E2E36',
    },

    targetDate: {
      paddingTop: 10,
      fontSize: 9.5,
      color: '#9A858D',
    },

    updateCard: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 13,
      padding: 14,
      borderRadius: 19,
      backgroundColor:
        '#FDF1F5',
      borderWidth: 1,
      borderColor:
        '#F0DDE5',
    },

    updateIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#FFFFFF',
      marginRight: 11,
    },

    updateIconText: {
      fontSize: 20,
      color: '#9B4F70',
    },

    updateTitle: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#743D59',
    },

    updateText: {
      marginTop: 3,
      fontSize: 10.5,
      lineHeight: 15,
      color: '#80616F',
    },

    updateArrow: {
      fontSize: 20,
      color: '#9B4F70',
      marginLeft: 8,
    },

    signOutButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 22,
      padding: 15,
      borderRadius: 19,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#F0DEE5',
    },

    signOutIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#FFF1F3',
      marginRight: 11,
    },

    signOutIconText: {
      fontSize: 20,
      color: '#B14F63',
    },

    signOutTitle: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#9D4559',
    },

    signOutSubtitle: {
      marginTop: 3,
      fontSize: 10.5,
      color: '#9A858D',
    },

    signOutArrow: {
      fontSize: 20,
      color: '#B14F63',
    },

    note: {
      flexDirection:
        'row',
      marginTop: 20,
      paddingHorizontal: 8,
    },

    noteIcon: {
      marginRight: 7,
      fontSize: 11,
      color: '#B45D83',
    },

    noteText: {
      flex: 1,
      fontSize: 9.5,
      lineHeight: 15,
      color: '#A18C94',
    },

    editorCard: {
      padding: 17,
      borderRadius: 22,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#F0DEE5',
    },

    editorLabel: {
      marginBottom: 7,
      fontSize: 11,
      fontWeight: '700',
      color: '#59434D',
    },

    inputWrapper: {
      flexDirection:
        'row',
      alignItems:
        'center',
      minHeight: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#EEDDE4',
      backgroundColor:
        '#FFF9FB',
    },

    input: {
      flex: 1,
      minHeight: 46,
      paddingHorizontal: 13,
      color: '#403039',
      fontSize: 13,
    },

    suffix: {
      paddingRight: 12,
      fontSize: 10,
      fontWeight: '700',
      color: '#9A858D',
    },

    twoColumn: {
      flexDirection:
        'row',
      gap: 10,
    },

    optionRow: {
      flexDirection:
        'row',
      gap: 8,
      marginBottom: 13,
    },

    option: {
      flex: 1,
      minHeight: 43,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal: 9,
      borderRadius: 13,
      backgroundColor:
        '#FFF9FB',
      borderWidth: 1,
      borderColor:
        '#EEDDE4',
      marginBottom: 8,
    },

    optionFull: {
      flex: 0,
      width: '100%',
      justifyContent:
        'space-between',
      paddingHorizontal: 14,
    },

    optionSelected: {
      backgroundColor:
        '#FDF1F5',
      borderColor:
        '#C984A2',
    },

    optionText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#806C75',
    },

    optionTextSelected: {
      color: '#9B4F70',
    },

    check: {
      width: 19,
      height: 19,
      borderRadius: 10,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#9B4F70',
    },

    checkText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },

    activityOption: {
      flexDirection:
        'row',
      alignItems:
        'center',
      padding: 12,
      marginBottom: 8,
      borderRadius: 14,
      backgroundColor:
        '#FFF9FB',
      borderWidth: 1,
      borderColor:
        '#EEDDE4',
    },

    activityOptionSelected: {
      backgroundColor:
        '#FDF1F5',
      borderColor:
        '#C984A2',
    },

    radio: {
      width: 19,
      height: 19,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor:
        '#C9B5BE',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    radioSelected: {
      borderColor:
        '#9B4F70',
    },

    radioDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor:
        '#9B4F70',
    },

    activityTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#403039',
    },

    activityDescription: {
      marginTop: 2,
      fontSize: 10,
      color: '#958089',
    },

    actionRow: {
      flexDirection:
        'row',
      gap: 9,
      marginTop: 12,
    },

    cancelButton: {
      width: 92,
      height: 50,
      borderRadius: 16,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5D4DC',
    },

    cancelText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#806C75',
    },

    saveButton: {
      flex: 1,
      height: 50,
      borderRadius: 16,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#9B4F70',
    },

    saveText: {
      color: '#FFFFFF',
      fontSize: 12.5,
      fontWeight: '800',
    },

    emptyCard: {
      alignItems:
        'center',
      padding: 24,
      borderRadius: 22,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#F0DEE5',
    },

    emptyIcon: {
      fontSize: 28,
    },

    emptyTitle: {
      marginTop: 9,
      fontSize: 15,
      fontWeight: '800',
      color: '#45323B',
    },

    emptyText: {
      marginTop: 5,
      fontSize: 11,
      lineHeight: 17,
      textAlign:
        'center',
      color: '#8F7A83',
    },

    loadingScreen: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#FFF8FA',
    },

    loadingLogo: {
      width: 54,
      height: 54,
      borderRadius: 19,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#F8E7EE',
    },

    loadingLogoText: {
      fontSize: 25,
      fontWeight: '800',
      color: '#8E4566',
    },

    loadingTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 4,
      color: '#743D59',
    },

    loadingText: {
      marginTop: 8,
      fontSize: 11,
      color: '#9A858D',
    },
  });