import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

type NutritionResult = {
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  confidence: string;
  notes: string;
};

export default function LogMealScreen() {
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState('Breakfast');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] =
    useState<NutritionResult | null>(null);

  const mealTypes = [
    'Breakfast',
    'Lunch',
    'Snacks',
    'Dinner',
    'Miscellaneous',
  ];

  const handleAnalyze = async () => {
    if (!mealText.trim()) {
      Alert.alert(
        'Tell AMORA what you ate',
        'For example: "2 besan chillas with 100g curd"'
      );
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          'AMORA API URL is not configured.'
        );
      }

      const response = await fetch(
        `${apiUrl}/api/food/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meal_text: mealText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'AMORA could not analyze this meal.'
        );
      }

      if (!data?.success || !data?.data) {
        throw new Error(
          'AMORA returned an invalid nutrition result.'
        );
      }

      setResult(data.data);
    } catch (error) {
      console.error(
        'AMORA food analysis error:',
        error
      );

      Alert.alert(
        'Could not analyze meal',
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!result) {
      return;
    }

    setSaving(true);

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
          'No authenticated user found.'
        );
      }

      const today =
        new Date().toISOString().split('T')[0];

      const databaseMealType =
        mealType === 'Snacks'
          ? 'snack'
          : mealType.toLowerCase();

      const { error } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          log_date: today,
          meal_type: databaseMealType,
          food_name: result.food_name,
          quantity: result.quantity,
          unit: result.unit,
          calories: result.calories,
          protein_g: result.protein_g,
          carbs_g: result.carbs_g,
          fat_g: result.fat_g,
          fiber_g: result.fiber_g,
          sugar_g: result.sugar_g,
          source: 'ai_estimate',
          notes: `${result.notes} Original entry: ${mealText.trim()}`,
        });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Meal added ✨',
        `${result.food_name} has been added to today's ${mealType.toLowerCase()} log.`,
        [
          {
            text: 'Add another meal',
            onPress: () => {
              setMealText('');
              setResult(null);
              setMealType('Breakfast');
            },
          },
          {
            text: 'View meals',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'Save meal error:',
        error
      );

      Alert.alert(
        'Could not save meal',
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving your meal.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>
          AMORA AI
        </Text>

        <Text style={styles.title}>
          What did you eat? 🍓
        </Text>

        <Text style={styles.subtitle}>
          Tell me naturally. You don't need to know
          calories, protein, or macros.
        </Text>

        <View style={styles.aiCard}>
          <View style={styles.aiCircle}>
            <Text style={styles.aiIcon}>✦</Text>
          </View>

          <View style={styles.aiCardContent}>
            <Text style={styles.aiTitle}>
              I'll analyze it for you
            </Text>

            <Text style={styles.aiText}>
              Just describe your meal and I'll
              estimate its nutrition.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Meal type
        </Text>

        <View style={styles.mealTypes}>
          {mealTypes.map((type) => {
            const selected = mealType === type;

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealType,
                  selected &&
                    styles.mealTypeSelected,
                ]}
                onPress={() => setMealType(type)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    selected &&
                      styles.mealTypeTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>
          Describe your meal
        </Text>

        <TextInput
          style={styles.textArea}
          placeholder={
            'Example:\n\nI had 2 besan chillas with 100g curd and some green chutney'
          }
          placeholderTextColor="#A9959E"
          multiline
          textAlignVertical="top"
          value={mealText}
          onChangeText={setMealText}
        />

        <Text style={styles.helperText}>
          You can mention approximate quantities,
          ingredients, restaurant names, or how much
          you ate.
        </Text>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            analyzing &&
              styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={analyzing || saving}
          activeOpacity={0.85}
        >
          {analyzing ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text style={styles.buttonText}>
                Analyzing...
              </Text>
            </>
          ) : (
            <Text style={styles.buttonText}>
              Analyze my meal ✨
            </Text>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultEyebrow}>
              AMORA ESTIMATE
            </Text>

            <Text style={styles.resultTitle}>
              {result.food_name}
            </Text>

            <Text style={styles.resultQuantity}>
              {result.quantity} {result.unit}
            </Text>

            <View style={styles.nutritionGrid}>
              <NutritionItem
                label="Calories"
                value={`${Math.round(result.calories)} kcal`}
              />

              <NutritionItem
                label="Protein"
                value={`${result.protein_g.toFixed(1)} g`}
              />

              <NutritionItem
                label="Carbs"
                value={`${result.carbs_g.toFixed(1)} g`}
              />

              <NutritionItem
                label="Fat"
                value={`${result.fat_g.toFixed(1)} g`}
              />

              <NutritionItem
                label="Fiber"
                value={`${result.fiber_g.toFixed(1)} g`}
              />

              <NutritionItem
                label="Sugar"
                value={`${result.sugar_g.toFixed(1)} g`}
              />

              <NutritionItem
                label="Confidence"
                value={result.confidence}
              />
            </View>

            <View style={styles.estimateNote}>
              <Text style={styles.estimateNoteTitle}>
                ✨ Estimate
              </Text>

              <Text style={styles.estimateNoteText}>
                {result.notes}
              </Text>
            </View>

            <Text style={styles.reviewText}>
              Review this estimate before adding it
              to your daily log.
            </Text>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                saving &&
                  styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmAndSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text style={styles.buttonText}>
                    Saving...
                  </Text>
                </>
              ) : (
                <Text style={styles.buttonText}>
                  Confirm & Add to Today ✨
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>
            ✨ A quick note
          </Text>

          <Text style={styles.noteText}>
            Nutrition values are estimates. AMORA will
            clearly show when an estimate is being used.
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function NutritionItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.nutritionItem}>
      <Text style={styles.nutritionValue}>
        {value}
      </Text>

      <Text style={styles.nutritionLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 52,
    paddingBottom: 40,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E4EA',
    marginBottom: 22,
  },

  backText: {
    marginTop: -4,
    fontSize: 32,
    color: '#8E4566',
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#A65A7B',
  },

  title: {
    marginTop: 8,
    fontSize: 29,
    fontWeight: '800',
    color: '#302229',
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#806C75',
  },

  aiCard: {
    flexDirection: 'row',
    marginTop: 22,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FDF1F5',
    borderWidth: 1,
    borderColor: '#F0DDE5',
  },

  aiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBD0DC',
  },

  aiIcon: {
    fontSize: 20,
    color: '#8E4566',
  },

  aiCardContent: {
    flex: 1,
    marginLeft: 12,
  },

  aiTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#684555',
  },

  aiText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#806B74',
  },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 11,
    fontSize: 16,
    fontWeight: '800',
    color: '#403039',
  },

  mealTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  mealType: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBD9E1',
  },

  mealTypeSelected: {
    backgroundColor: '#9B4F70',
    borderColor: '#9B4F70',
  },

  mealTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#806C75',
  },

  mealTypeTextSelected: {
    color: '#FFFFFF',
  },

  textArea: {
    minHeight: 150,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBD9E1',
    fontSize: 14,
    lineHeight: 21,
    color: '#302229',
  },

  helperText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: '#9A858D',
  },

  analyzeButton: {
    height: 56,
    marginTop: 22,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9B4F70',
    flexDirection: 'row',
    gap: 9,
  },

  analyzeButtonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  resultCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBD9E1',
  },

  resultEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#A65A7B',
  },

  resultTitle: {
    marginTop: 7,
    fontSize: 20,
    fontWeight: '800',
    color: '#302229',
  },

  resultQuantity: {
    marginTop: 3,
    fontSize: 12,
    color: '#806C75',
  },

  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },

  nutritionItem: {
    width: '50%',
    paddingVertical: 10,
  },

  nutritionValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#684555',
  },

  nutritionLabel: {
    marginTop: 3,
    fontSize: 11,
    color: '#9A858D',
  },

  estimateNote: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFF4F7',
  },

  estimateNoteTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#684555',
  },

  estimateNoteText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: '#806B74',
  },

  reviewText: {
    marginTop: 13,
    fontSize: 11,
    lineHeight: 17,
    color: '#806C75',
  },

  confirmButton: {
    height: 52,
    marginTop: 16,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9B4F70',
    flexDirection: 'row',
    gap: 9,
  },

  confirmButtonDisabled: {
    opacity: 0.65,
  },

  noteCard: {
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FFF4F7',
    borderWidth: 1,
    borderColor: '#F2DDE5',
  },

  noteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#684555',
  },

  noteText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: '#806B74',
  },

  bottomSpace: {
    height: 20,
  },
});