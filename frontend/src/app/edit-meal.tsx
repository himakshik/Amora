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
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { supabase } from '../lib/supabase';

type MealType =
  | 'breakfast'
  | 'lunch'
  | 'snack'
  | 'dinner'
  | 'miscellaneous';

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

const mealTypes = [
  {
    label: 'Breakfast',
    value: 'breakfast' as MealType,
    emoji: '🌅',
  },
  {
    label: 'Lunch',
    value: 'lunch' as MealType,
    emoji: '☀️',
  },
  {
    label: 'Snacks',
    value: 'snack' as MealType,
    emoji: '🍓',
  },
  {
    label: 'Dinner',
    value: 'dinner' as MealType,
    emoji: '🌙',
  },
  {
    label: 'Miscellaneous',
    value: 'miscellaneous' as MealType,
    emoji: '✨',
  },
];

export default function EditMealScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');

  const [mealType, setMealType] =
    useState<MealType>('breakfast');

  const [analysis, setAnalysis] =
    useState<NutritionResult | null>(null);

  useEffect(() => {
    loadMeal();
  }, [id]);

  const loadMeal = async () => {
    try {
      setLoading(true);

      if (!id) {
        throw new Error('Meal ID is missing.');
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You are not logged in.');
      }

      const { data, error } = await supabase
        .from('food_logs')
        .select(
          `
            id,
            food_name,
            quantity,
            unit,
            meal_type,
            calories,
            protein_g,
            carbs_g,
            fat_g,
            fiber_g,
            sugar_g
          `
        )
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Meal not found.');
      }

      setFoodName(data.food_name ?? '');

      setQuantity(
        data.quantity != null
          ? String(data.quantity)
          : ''
      );

      setUnit(data.unit ?? '');

      setCalories(
        data.calories != null
          ? String(data.calories)
          : ''
      );

      setProtein(
        data.protein_g != null
          ? String(data.protein_g)
          : ''
      );

      setCarbs(
        data.carbs_g != null
          ? String(data.carbs_g)
          : ''
      );

      setFat(
        data.fat_g != null
          ? String(data.fat_g)
          : ''
      );

      setFiber(
        data.fiber_g != null
          ? String(data.fiber_g)
          : ''
      );

      setSugar(
        data.sugar_g != null
          ? String(data.sugar_g)
          : ''
      );

      if (data.meal_type) {
        setMealType(
          data.meal_type as MealType
        );
      }
    } catch (error) {
      console.error(
        'Edit meal loading error:',
        error
      );

      Alert.alert(
        'Could not load meal',
        'We could not find this meal. Please try again.',
        [
          {
            text: 'Go back',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!foodName.trim()) {
      Alert.alert(
        'Food name required',
        'Please enter the food you ate.'
      );
      return;
    }

    if (!quantity.trim()) {
      Alert.alert(
        'Quantity required',
        'Please enter the quantity.'
      );
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysis(null);

      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          'EXPO_PUBLIC_API_URL is not configured.'
        );
      }

      const mealDescription = [
        foodName.trim(),
        quantity.trim(),
        unit.trim(),
      ]
        .filter(Boolean)
        .join(' ');

      const response = await fetch(
        `${apiUrl}/api/food/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meal_text: mealDescription,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            'Unable to analyze the meal.'
        );
      }

      const result =
        json?.data as NutritionResult;

      if (!result) {
        throw new Error(
          'AMORA did not return nutrition data.'
        );
      }

      setAnalysis(result);

      setCalories(
        String(result.calories ?? 0)
      );

      setProtein(
        String(result.protein_g ?? 0)
      );

      setCarbs(
        String(result.carbs_g ?? 0)
      );

      setFat(
        String(result.fat_g ?? 0)
      );

      setFiber(
        String(result.fiber_g ?? 0)
      );

      setSugar(
        String(result.sugar_g ?? 0)
      );

      if (result.quantity != null) {
        setQuantity(
          String(result.quantity)
        );
      }

      if (result.unit) {
        setUnit(result.unit);
      }
    } catch (error) {
      console.error(
        'Meal re-analysis error:',
        error
      );

      Alert.alert(
        'Could not analyze meal',
        'AMORA could not recalculate the nutrition right now. Please check your connection and try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!foodName.trim()) {
      Alert.alert(
        'Food name required',
        'Please enter the name of the food.'
      );
      return;
    }

    if (!quantity.trim()) {
      Alert.alert(
        'Quantity required',
        'Please enter the quantity.'
      );
      return;
    }

    try {
      setSaving(true);

      if (!id) {
        throw new Error('Meal ID is missing.');
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You are not logged in.');
      }

      const { error } = await supabase
        .from('food_logs')
        .update({
          food_name: foodName.trim(),

          quantity: quantity
            ? Number(quantity)
            : null,

          unit: unit.trim() || null,

          meal_type: mealType,

          calories: calories
            ? Number(calories)
            : null,

          protein_g: protein
            ? Number(protein)
            : null,

          carbs_g: carbs
            ? Number(carbs)
            : null,

          fat_g: fat
            ? Number(fat)
            : null,

          fiber_g: fiber
            ? Number(fiber)
            : null,

          sugar_g: sugar
            ? Number(sugar)
            : null,

          source: analysis
            ? 'ai_estimate'
            : undefined,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Meal updated ✨',
        'Your meal and nutrition have been updated successfully.',
        [
          {
            text: 'Done',
            onPress: () => {
              router.replace('/(tabs)/meals');
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'Meal update error:',
        error
      );

      Alert.alert(
        'Could not update meal',
        'Something went wrong while saving your changes. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#9B4F70"
        />

        <Text style={styles.loadingText}>
          Loading your meal...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>
          EDIT MEAL
        </Text>

        <Text style={styles.title}>
          Update your meal ✨
        </Text>

        <Text style={styles.subtitle}>
          Change what you ate and let AMORA recalculate
          your nutrition.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Food name
          </Text>

          <TextInput
            value={foodName}
            onChangeText={(value) => {
              setFoodName(value);
              setAnalysis(null);
            }}
            placeholder="e.g. Besan chilla"
            placeholderTextColor="#B9A7AE"
            style={styles.input}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>
                Quantity
              </Text>

              <TextInput
                value={quantity}
                onChangeText={(value) => {
                  setQuantity(value);
                  setAnalysis(null);
                }}
                placeholder="2"
                placeholderTextColor="#B9A7AE"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>
                Unit
              </Text>

              <TextInput
                value={unit}
                onChangeText={(value) => {
                  setUnit(value);
                  setAnalysis(null);
                }}
                placeholder="pieces"
                placeholderTextColor="#B9A7AE"
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              analyzing &&
                styles.analyzeButtonDisabled,
            ]}
            activeOpacity={0.8}
            disabled={analyzing}
            onPress={handleAnalyze}
          >
            {analyzing ? (
              <>
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />

                <Text
                  style={styles.analyzeButtonText}
                >
                  AMORA is recalculating...
                </Text>
              </>
            ) : (
              <Text
                style={styles.analyzeButtonText}
              >
                🤖 Recalculate with AMORA
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Meal category
        </Text>

        <View style={styles.categoryGrid}>
          {mealTypes.map((meal) => {
            const selected =
              mealType === meal.value;

            return (
              <TouchableOpacity
                key={meal.value}
                style={[
                  styles.categoryButton,
                  selected &&
                    styles.categoryButtonSelected,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  setMealType(meal.value)
                }
              >
                <Text style={styles.categoryEmoji}>
                  {meal.emoji}
                </Text>

                <Text
                  style={[
                    styles.categoryButtonText,
                    selected &&
                      styles.categoryButtonTextSelected,
                  ]}
                >
                  {meal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>
          Nutrition
        </Text>

        <View style={styles.card}>
          <NutritionInput
            label="Calories"
            value={calories}
            onChangeText={setCalories}
            unit="kcal"
          />

          <NutritionInput
            label="Protein"
            value={protein}
            onChangeText={setProtein}
            unit="g"
          />

          <NutritionInput
            label="Carbs"
            value={carbs}
            onChangeText={setCarbs}
            unit="g"
          />

          <NutritionInput
            label="Fat"
            value={fat}
            onChangeText={setFat}
            unit="g"
          />

          <NutritionInput
            label="Fiber"
            value={fiber}
            onChangeText={setFiber}
            unit="g"
          />

          <NutritionInput
            label="Sugar"
            value={sugar}
            onChangeText={setSugar}
            unit="g"
          />
        </View>

        {analysis ? (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>
              ✨ Updated AMORA estimate
            </Text>

            <Text style={styles.analysisText}>
              AMORA recalculated this meal using your
              updated food and quantity.
            </Text>

            <View style={styles.analysisGrid}>
              <AnalysisValue
                value={analysis.calories}
                label="Calories"
                unit="kcal"
              />

              <AnalysisValue
                value={analysis.protein_g}
                label="Protein"
                unit="g"
              />

              <AnalysisValue
                value={analysis.carbs_g}
                label="Carbs"
                unit="g"
              />

              <AnalysisValue
                value={analysis.fat_g}
                label="Fat"
                unit="g"
              />

              <AnalysisValue
                value={analysis.fiber_g}
                label="Fiber"
                unit="g"
              />

              <AnalysisValue
                value={analysis.sugar_g}
                label="Sugar"
                unit="g"
              />
            </View>

            <Text style={styles.confidence}>
              Confidence: {analysis.confidence}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving &&
              styles.saveButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Changes ✨
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          activeOpacity={0.8}
          disabled={saving}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function NutritionInput({
  label,
  value,
  onChangeText,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  unit: string;
}) {
  return (
    <View style={styles.nutritionInputContainer}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View style={styles.nutritionInputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#B9A7AE"
          style={styles.nutritionInput}
        />

        <Text style={styles.nutritionUnit}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

function AnalysisValue({
  value,
  label,
  unit,
}: {
  value: number;
  label: string;
  unit: string;
}) {
  return (
    <View style={styles.analysisValue}>
      <Text style={styles.analysisNumber}>
        {Math.round(Number(value ?? 0))}
        {unit === 'kcal' ? '' : 'g'}
      </Text>

      <Text style={styles.analysisUnit}>
        {unit}
      </Text>

      <Text style={styles.analysisLabel}>
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

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8FA',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#806C75',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 55,
    paddingBottom: 50,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 22,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },

  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9B4F70',
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#A65A7B',
  },

  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
    color: '#302229',
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#806C75',
  },

  card: {
    marginTop: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DEE5',
  },

  label: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: '700',
    color: '#57434C',
  },

  input: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EEDDE4',
    backgroundColor: '#FFF9FB',
    fontSize: 14,
    color: '#403039',
  },

  row: {
    flexDirection: 'row',
    marginTop: 15,
  },

  halfField: {
    flex: 1,
  },

  analyzeButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: '#9B4F70',
  },

  analyzeButtonDisabled: {
    opacity: 0.65,
  },

  analyzeButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#302229',
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  categoryButton: {
    width: '48%',
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DEE5',
  },

  categoryButtonSelected: {
    backgroundColor: '#FDF1F5',
    borderColor: '#C984A2',
  },

  categoryEmoji: {
    fontSize: 19,
  },

  categoryButtonText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#806C75',
  },

  categoryButtonTextSelected: {
    color: '#9B4F70',
  },

  nutritionInputContainer: {
    marginBottom: 15,
  },

  nutritionInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EEDDE4',
    backgroundColor: '#FFF9FB',
  },

  nutritionInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#403039',
  },

  nutritionUnit: {
    marginRight: 14,
    fontSize: 12,
    fontWeight: '700',
    color: '#9A858D',
  },

  analysisCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FDF1F5',
    borderWidth: 1,
    borderColor: '#F0D5E0',
  },

  analysisTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9B4F70',
  },

  analysisText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: '#806C75',
  },

  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },

  analysisValue: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 14,
  },

  analysisNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#403039',
  },

  analysisUnit: {
    marginTop: 1,
    fontSize: 9,
    color: '#9B4F70',
  },

  analysisLabel: {
    marginTop: 2,
    fontSize: 9,
    color: '#9A858D',
  },

  confidence: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#806C75',
  },

  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginTop: 28,
    borderRadius: 18,
    backgroundColor: '#9B4F70',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 10,
    borderRadius: 16,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#806C75',
  },
});