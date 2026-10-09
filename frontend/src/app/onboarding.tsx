import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import { supabase } from '../lib/supabase';
import {
  generatePersonalizedPlan,
  type PersonalizedPlanInput,
} from '../services/personalizedPlan';
import { saveNutritionTargets } from '../services/saveNutritionTargets';

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

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] =
    useState<Gender>('female');

  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] =
    useState('');

  const [goalType, setGoalType] =
    useState<GoalType>('lose_weight');

  const [goalWeight, setGoalWeight] = useState('');
  const [targetDays, setTargetDays] = useState('');

  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>('light');

  const [dailySteps, setDailySteps] =
    useState('');

  const [exerciseDays, setExerciseDays] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');

  /*
   * Explicitly type this as a percentage dimension.
   * This prevents React Native TypeScript from
   * treating the value as a generic string.
   */
  const progressWidth =
    `${(step / TOTAL_STEPS) * 100}%` as `${number}%`;

  const isStepOneValid =
    name.trim().length >= 2 &&
    Number(age) >= 13 &&
    Number(age) <= 100 &&
    Number(height) >= 100 &&
    Number(height) <= 230 &&
    Number(currentWeight) >= 30 &&
    Number(currentWeight) <= 300;

  const isStepTwoValid =
    goalType === 'maintain_weight'
      ? true
      : Number(goalWeight) >= 30 &&
        Number(goalWeight) <= 300 &&
        Number(targetDays) >= 14 &&
        Number(targetDays) <= 3650;

  const isStepThreeValid =
    Number(dailySteps) >= 0 &&
    Number(dailySteps) <= 100000 &&
    Number(exerciseDays) >= 0 &&
    Number(exerciseDays) <= 7;

  const clearError = () => {
    setErrorMessage('');
  };

  const handleNext = () => {
    clearError();

    if (step === 1) {
      if (!isStepOneValid) {
        setErrorMessage(
          'Please complete your basic details before continuing.'
        );
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!isStepTwoValid) {
        setErrorMessage(
          'Please enter a valid target weight and timeline.'
        );
        return;
      }

      setStep(3);
    }
  };

  const handleBack = () => {
    clearError();

    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    if (!isStepThreeValid || loading) {
      setErrorMessage(
        'Please complete your activity details.'
      );
      return;
    }

    setLoading(true);
    clearError();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'Your session has expired. Please log in again.'
        );
      }

      const parsedAge = Number(age);
      const parsedHeight = Number(height);
      const parsedCurrentWeight =
        Number(currentWeight);
      const parsedDailySteps = Number(dailySteps);
      const parsedExerciseDays =
        Number(exerciseDays);

      const parsedGoalWeight =
        goalType === 'maintain_weight'
          ? parsedCurrentWeight
          : Number(goalWeight);

      const parsedTargetDays =
        goalType === 'maintain_weight'
          ? 365
          : Number(targetDays);

      const currentYear =
        new Date().getFullYear();

      const birthYear =
        currentYear - parsedAge;

      const dateOfBirth =
        `${birthYear}-01-01`;

      /*
       * Save profile.
       */
      const { error: profileError } =
        await supabase
          .from('profiles')
          .upsert(
            {
              user_id: user.id,
              full_name: name.trim(),
              date_of_birth: dateOfBirth,
              height_cm: parsedHeight,
              weight_kg: parsedCurrentWeight,
              gender,
              average_daily_steps:
                parsedDailySteps,
              exercise_days_per_week:
                parsedExerciseDays,
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          );

      if (profileError) {
        throw profileError;
      }

      /*
       * Deactivate any previous active goal.
       */
      const { error: deactivateError } =
        await supabase
          .from('goals')
          .update({
            is_active: false,
          })
          .eq('user_id', user.id)
          .eq('is_active', true);

      if (deactivateError) {
        throw deactivateError;
      }

      /*
       * Create the active goal.
       */
      const { error: goalError } =
        await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            goal_type: goalType,
            target_weight_kg:
              parsedGoalWeight,
            target_days: parsedTargetDays,
            activity_level: activityLevel,
            is_active: true,
          });

      if (goalError) {
        throw goalError;
      }

      /*
       * Generate personalized targets
       * using the Gemini-powered backend.
       */
      const planInput: PersonalizedPlanInput = {
        profile: {
          age: parsedAge,
          gender,
          height_cm: parsedHeight,
          current_weight_kg:
            parsedCurrentWeight,
          average_daily_steps:
            parsedDailySteps,
          exercise_days_per_week:
            parsedExerciseDays,
        },
        goal: {
          goal_type: goalType,
          target_weight_kg:
            parsedGoalWeight,
          target_days: parsedTargetDays,
          activity_level:
            activityLevel,
        },
      };

      const personalizedPlan =
        await generatePersonalizedPlan(
          planInput
        );

      /*
       * Save today's personalized targets.
       */
      const today =
        new Date()
          .toISOString()
          .split('T')[0];

      await saveNutritionTargets(
        personalizedPlan,
        today
      );

      Alert.alert(
        'Your AMORA plan is ready ✨',
        [
          `Calories: ${Math.round(
            personalizedPlan.daily_calories
          )} kcal`,
          `Protein: ${Math.round(
            personalizedPlan.protein_g
          )} g`,
          `Fiber: ${Math.round(
            personalizedPlan.fiber_g
          )} g`,
          `Water: ${
            Math.round(
              personalizedPlan.water_ml / 100
            ) / 10
          } L`,
          `Steps: ${Math.round(
            personalizedPlan.steps_target
          ).toLocaleString()}`,
          `Exercise: ${Math.round(
            personalizedPlan.exercise_minutes_target
          )} min`,
        ].join('\n'),
        [
          {
            text: 'Start my journey',
            onPress: () => {
              router.replace('/');
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'ONBOARDING ERROR:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating your AMORA plan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProgress = () => (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          YOUR AMORA JOURNEY
        </Text>

        <Text style={styles.progressCount}>
          {String(step).padStart(2, '0')} / 03
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
            },
          ]}
        />
      </View>
    </View>
  );

  const renderStepOne = () => (
    <>
      <View style={styles.stepIntro}>
        <Text style={styles.eyebrow}>
          LET&apos;S GET TO KNOW YOU
        </Text>

        <Text style={styles.title}>
          Your wellness journey,
          {'\n'}
          your way. ✨
        </Text>

        <Text style={styles.subtitle}>
          Tell AMORA a little about yourself so
          your plan can actually feel personal.
        </Text>
      </View>

      <View style={styles.form}>
        <InputField
          label="What should we call you?"
          placeholder="Your name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            clearError();
          }}
          icon="♡"
          autoCapitalize="words"
        />

        <InputField
          label="How old are you?"
          placeholder="Age"
          value={age}
          onChangeText={(value) => {
            setAge(
              value.replace(/[^0-9]/g, '')
            );
            clearError();
          }}
          icon="✦"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>
          How do you identify?
        </Text>

        <View style={styles.chipRow}>
          <SelectionChip
            label="Female"
            selected={gender === 'female'}
            onPress={() => {
              setGender('female');
              clearError();
            }}
          />

          <SelectionChip
            label="Male"
            selected={gender === 'male'}
            onPress={() => {
              setGender('male');
              clearError();
            }}
          />

          <SelectionChip
            label="Other"
            selected={gender === 'other'}
            onPress={() => {
              setGender('other');
              clearError();
            }}
          />
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <InputField
              label="Height"
              placeholder="160"
              value={height}
              onChangeText={(value) => {
                setHeight(
                  value.replace(
                    /[^0-9.]/g,
                    ''
                  )
                );
                clearError();
              }}
              icon="↕"
              keyboardType="decimal-pad"
              suffix="cm"
            />
          </View>

          <View style={styles.column}>
            <InputField
              label="Current weight"
              placeholder="72"
              value={currentWeight}
              onChangeText={(value) => {
                setCurrentWeight(
                  value.replace(
                    /[^0-9.]/g,
                    ''
                  )
                );
                clearError();
              }}
              icon="◌"
              keyboardType="decimal-pad"
              suffix="kg"
            />
          </View>
        </View>
      </View>
    </>
  );

  const renderStepTwo = () => (
    <>
      <View style={styles.stepIntro}>
        <Text style={styles.eyebrow}>
          YOUR GOAL
        </Text>

        <Text style={styles.title}>
          What are we working
          {'\n'}
          towards? 🎯
        </Text>

        <Text style={styles.subtitle}>
          AMORA will use your goal together with
          your profile to create realistic daily
          targets.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>
          What would you like to achieve?
        </Text>

        <View style={styles.goalCards}>
          <GoalCard
            title="Lose weight"
            description="Feel lighter & stronger"
            icon="↓"
            selected={
              goalType === 'lose_weight'
            }
            onPress={() => {
              setGoalType('lose_weight');
              clearError();
            }}
          />

          <GoalCard
            title="Maintain weight"
            description="Build healthy consistency"
            icon="→"
            selected={
              goalType ===
              'maintain_weight'
            }
            onPress={() => {
              setGoalType(
                'maintain_weight'
              );
              clearError();
            }}
          />

          <GoalCard
            title="Gain weight"
            description="Build up gradually"
            icon="↑"
            selected={
              goalType === 'gain_weight'
            }
            onPress={() => {
              setGoalType('gain_weight');
              clearError();
            }}
          />
        </View>

        {goalType !== 'maintain_weight' && (
          <>
            <InputField
              label={
                goalType === 'lose_weight'
                  ? 'Target weight'
                  : 'Goal weight'
              }
              placeholder={
                goalType === 'lose_weight'
                  ? '62'
                  : '75'
              }
              value={goalWeight}
              onChangeText={(value) => {
                setGoalWeight(
                  value.replace(
                    /[^0-9.]/g,
                    ''
                  )
                );
                clearError();
              }}
              icon="◎"
              keyboardType="decimal-pad"
              suffix="kg"
            />

            <InputField
              label="How many days are you aiming for?"
              placeholder="120"
              value={targetDays}
              onChangeText={(value) => {
                setTargetDays(
                  value.replace(
                    /[^0-9]/g,
                    ''
                  )
                );
                clearError();
              }}
              icon="◷"
              keyboardType="number-pad"
              suffix="days"
            />

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>
                ✦
              </Text>

              <Text style={styles.infoText}>
                AMORA will not blindly force an
                aggressive target. Your requested
                timeline is considered, but the AI
                will generate safer practical daily
                targets.
              </Text>
            </View>
          </>
        )}

        {goalType === 'maintain_weight' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>
              ✦
            </Text>

            <Text style={styles.infoText}>
              Great choice. AMORA will focus on
              maintaining your current weight while
              supporting nutrition, movement,
              hydration and sleep.
            </Text>
          </View>
        )}
      </View>
    </>
  );

  const renderStepThree = () => (
    <>
      <View style={styles.stepIntro}>
        <Text style={styles.eyebrow}>
          YOUR LIFESTYLE
        </Text>

        <Text style={styles.title}>
          Let&apos;s make it
          {'\n'}
          realistic. 🌷
        </Text>

        <Text style={styles.subtitle}>
          Your routine helps AMORA decide what
          targets are practical for your everyday
          life.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>
          How active are you usually?
        </Text>

        <View style={styles.activityCards}>
          <ActivityCard
            title="Mostly sitting"
            description="Little structured activity"
            selected={
              activityLevel ===
              'sedentary'
            }
            onPress={() => {
              setActivityLevel(
                'sedentary'
              );
              clearError();
            }}
          />

          <ActivityCard
            title="Lightly active"
            description="Walking + light exercise"
            selected={
              activityLevel === 'light'
            }
            onPress={() => {
              setActivityLevel('light');
              clearError();
            }}
          />

          <ActivityCard
            title="Moderately active"
            description="Regular exercise"
            selected={
              activityLevel ===
              'moderate'
            }
            onPress={() => {
              setActivityLevel(
                'moderate'
              );
              clearError();
            }}
          />

          <ActivityCard
            title="Very active"
            description="Frequent intense activity"
            selected={
              activityLevel ===
              'very_active'
            }
            onPress={() => {
              setActivityLevel(
                'very_active'
              );
              clearError();
            }}
          />
        </View>

        <InputField
          label="Your average daily steps"
          placeholder="7000"
          value={dailySteps}
          onChangeText={(value) => {
            setDailySteps(
              value.replace(
                /[^0-9]/g,
                ''
              )
            );
            clearError();
          }}
          icon="⌁"
          keyboardType="number-pad"
          suffix="steps"
        />

        <InputField
          label="Exercise days per week"
          placeholder="3"
          value={exerciseDays}
          onChangeText={(value) => {
            setExerciseDays(
              value.replace(
                /[^0-9]/g,
                ''
              )
            );
            clearError();
          }}
          icon="✦"
          keyboardType="number-pad"
          suffix="days"
        />

        <View style={styles.readyCard}>
          <View style={styles.readyIcon}>
            <Text style={styles.readyIconText}>
              ✨
            </Text>
          </View>

          <View style={styles.readyContent}>
            <Text style={styles.readyTitle}>
              Almost there
            </Text>

            <Text style={styles.readyText}>
              AMORA is ready to create your
              personalized wellness plan.
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>
              AMORA
            </Text>

            <Text style={styles.sparkle}>
              ✦
            </Text>
          </View>

          {renderProgress()}

          {step === 1 &&
            renderStepOne()}

          {step === 2 &&
            renderStepTwo()}

          {step === 3 &&
            renderStepThree()}

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            {step > 1 ? (
              <Pressable
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
              >
                <Text
                  style={styles.backButtonText}
                >
                  ← Back
                </Text>
              </Pressable>
            ) : (
              <View
                style={styles.backPlaceholder}
              />
            )}

            {step < TOTAL_STEPS ? (
              <Pressable
                style={[
                  styles.primaryButton,
                  (
                    step === 1
                      ? !isStepOneValid
                      : !isStepTwoValid
                  ) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={
                  step === 1
                    ? !isStepOneValid
                    : !isStepTwoValid
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Continue
                </Text>

                <Text style={styles.arrow}>
                  →
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.primaryButton,
                  (
                    !isStepThreeValid ||
                    loading
                  ) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={handleFinish}
                disabled={
                  !isStepThreeValid ||
                  loading
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {loading
                    ? 'Creating your plan...'
                    : 'Create my plan'}
                </Text>

                {!loading && (
                  <Text
                    style={styles.arrow}
                  >
                    ✦
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          <Text style={styles.footer}>
            Your everyday AI wellness companion ✦
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType,
  suffix,
  autoCapitalize = 'none',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: string;
  keyboardType?:
    | 'default'
    | 'number-pad'
    | 'decimal-pad';
  suffix?: string;
  autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words'
    | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>
          {icon}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#B9A4AD"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />

        {suffix ? (
          <Text style={styles.inputSuffix}>
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function SelectionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          selected &&
            styles.chipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function GoalCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.goalCard,
        selected && styles.goalCardSelected,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.goalIcon,
          selected &&
            styles.goalIconSelected,
        ]}
      >
        <Text
          style={[
            styles.goalIconText,
            selected &&
              styles.goalIconTextSelected,
          ]}
        >
          {icon}
        </Text>
      </View>

      <View style={styles.goalContent}>
        <Text style={styles.goalTitle}>
          {title}
        </Text>

        <Text style={styles.goalDescription}>
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.radio,
          selected && styles.radioSelected,
        ]}
      >
        {selected ? (
          <View style={styles.radioDot} />
        ) : null}
      </View>
    </Pressable>
  );
}

function ActivityCard({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.activityCard,
        selected &&
          styles.activityCardSelected,
      ]}
      onPress={onPress}
    >
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>
          {title}
        </Text>

        <Text
          style={styles.activityDescription}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.radio,
          selected && styles.radioSelected,
        ]}
      >
        {selected ? (
          <View style={styles.radioDot} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA',
    overflow: 'hidden',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },

  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },

  blobOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#F6DCE7',
    top: -110,
    right: -80,
    opacity: 0.65,
  },

  blobTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#EEDCE8',
    bottom: -80,
    left: -80,
    opacity: 0.5,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  brand: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#743D59',
  },

  sparkle: {
    marginLeft: 5,
    marginTop: -3,
    fontSize: 15,
    color: '#B45D83',
  },

  progressSection: {
    marginTop: 22,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    color: '#A65A7B',
  },

  progressCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A18A93',
  },

  progressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 10,
    backgroundColor: '#E8D6DE',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#9B4F70',
  },

  stepIntro: {
    marginTop: 24,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#A65A7B',
    marginBottom: 9,
  },

  title: {
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '800',
    color: '#302229',
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 20,
    color: '#79646D',
  },

  form: {
    marginTop: 24,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#59434D',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D8DF',
  },

  inputIcon: {
    width: 25,
    fontSize: 17,
    color: '#A85478',
    textAlign: 'center',
    marginRight: 8,
  },

  input: {
    flex: 1,
    minHeight: 50,
    color: '#302229',
    fontSize: 15,
  },

  inputSuffix: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#9C808C',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 18,
  },

  chip: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D8DF',
  },

  chipSelected: {
    backgroundColor: '#F8E7EE',
    borderColor: '#B45D83',
  },

  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#79646D',
  },

  chipTextSelected: {
    color: '#8E4566',
  },

  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },

  column: {
    flex: 1,
  },

  goalCards: {
    gap: 10,
    marginBottom: 20,
  },

  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D8DF',
  },

  goalCardSelected: {
    backgroundColor: '#FDF1F5',
    borderColor: '#B45D83',
  },

  goalIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4E9EE',
    marginRight: 12,
  },

  goalIconSelected: {
    backgroundColor: '#F2D6E2',
  },

  goalIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9C7183',
  },

  goalIconTextSelected: {
    color: '#8E4566',
  },

  goalContent: {
    flex: 1,
  },

  goalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#45323B',
  },

  goalDescription: {
    marginTop: 3,
    fontSize: 11,
    color: '#927C85',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D8C2CC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioSelected: {
    borderColor: '#9B4F70',
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9B4F70',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    marginTop: 2,
    borderRadius: 16,
    backgroundColor: '#FDF1F5',
    borderWidth: 1,
    borderColor: '#F0DDE5',
  },

  infoIcon: {
    fontSize: 15,
    color: '#A85478',
    marginRight: 9,
  },

  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: '#765664',
  },

  activityCards: {
    gap: 9,
    marginBottom: 19,
  },

  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D8DF',
  },

  activityCardSelected: {
    backgroundColor: '#FDF1F5',
    borderColor: '#B45D83',
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#45323B',
  },

  activityDescription: {
    marginTop: 3,
    fontSize: 11,
    color: '#927C85',
  },

  readyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F8E7EE',
    borderWidth: 1,
    borderColor: '#EBCBD8',
  },

  readyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },

  readyIconText: {
    fontSize: 18,
  },

  readyContent: {
    flex: 1,
  },

  readyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#743D59',
  },

  readyText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: '#80616F',
  },

  errorCard: {
    marginTop: 16,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#FCECEF',
    borderWidth: 1,
    borderColor: '#F1CCD6',
  },

  errorText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#B45D72',
    textAlign: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 10,
  },

  backPlaceholder: {
    width: 72,
  },

  backButton: {
    minWidth: 72,
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E4566',
  },

  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 19,
    backgroundColor: '#9B4F70',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 4,
  },

  primaryButtonDisabled: {
    backgroundColor: '#D8C2CC',
    shadowOpacity: 0,
    elevation: 0,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  arrow: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '600',
  },

  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: '#B39DA6',
    marginTop: 14,
  },
});