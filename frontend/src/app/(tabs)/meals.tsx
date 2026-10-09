import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';

import { supabase } from '../../lib/supabase';

type MealType =
  | 'breakfast'
  | 'lunch'
  | 'snack'
  | 'dinner'
  | 'miscellaneous';

type FoodLog = {
  id: string;
  food_name: string;
  quantity: number | null;
  unit: string | null;
  meal_type: MealType | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  notes: string | null;
};

const mealTypes = [
  {
    name: 'Breakfast',
    value: 'breakfast' as MealType,
    emoji: '🌅',
  },
  {
    name: 'Lunch',
    value: 'lunch' as MealType,
    emoji: '☀️',
  },
  {
    name: 'Snacks',
    value: 'snack' as MealType,
    emoji: '🍓',
  },
  {
    name: 'Dinner',
    value: 'dinner' as MealType,
    emoji: '🌙',
  },
  {
    name: 'Miscellaneous',
    value: 'miscellaneous' as MealType,
    emoji: '✨',
  },
];

export default function MealsScreen() {
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMeals = async () => {
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
        return;
      }

      const today = new Date()
        .toISOString()
        .split('T')[0];

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
            sugar_g,
            notes
          `
        )
        .eq('user_id', user.id)
        .eq('log_date', today)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setFoodLogs((data as FoodLog[]) ?? []);
    } catch (error) {
      console.error(
        'Meals loading error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          TODAY
        </Text>

        <Text style={styles.title}>
          Your meals 🍓
        </Text>

        <Text style={styles.subtitle}>
          Log what you eat and AMORA will keep your
          nutrition on track.
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() =>
            router.push('/log-meal')
          }
        >
          <View style={styles.addCircle}>
            <Text style={styles.addIcon}>+</Text>
          </View>

          <View>
            <Text style={styles.addButtonTitle}>
              Log a meal
            </Text>

            <Text style={styles.addButtonSubtitle}>
              Tell AMORA what you ate
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Today&apos;s meals
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="small"
              color="#9B4F70"
            />

            <Text style={styles.loadingText}>
              Loading your meals...
            </Text>
          </View>
        ) : foodLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>
              🍽️
            </Text>

            <Text style={styles.emptyTitle}>
              Nothing logged yet
            </Text>

            <Text style={styles.emptyText}>
              Tell AMORA what you ate and your meal
              will appear here.
            </Text>
          </View>
        ) : (
          foodLogs.map((food) => (
            <FoodLogCard
              key={food.id}
              food={food}
            />
          ))
        )}

        <Text style={styles.mealSectionTitle}>
          Meal categories
        </Text>

        {mealTypes.map((meal) => {
          const categoryMeals = foodLogs.filter(
            (food) =>
              food.meal_type === meal.value
          );

          return (
            <View
              key={meal.name}
              style={styles.categoryCard}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>
                  {meal.emoji}
                </Text>
              </View>

              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>
                  {meal.name}
                </Text>

                <Text style={styles.categoryStatus}>
                  {categoryMeals.length > 0
                    ? `${categoryMeals.length} ${
                        categoryMeals.length === 1
                          ? 'meal'
                          : 'meals'
                      } logged`
                    : 'No meal logged'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FoodLogCard({
  food,
}: {
  food: FoodLog;
}) {
  const quantityText =
    food.quantity != null
      ? `${food.quantity}${
          food.unit ? ` ${food.unit}` : ''
        }`
      : '';

  const handleEdit = () => {
    router.push({
      pathname: '/edit-meal',
      params: {
        id: food.id,
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete meal?',
      `Are you sure you want to delete "${food.food_name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('food_logs')
                .delete()
                .eq('id', food.id);

              if (error) {
                throw error;
              }

              Alert.alert(
                'Meal deleted',
                'The meal has been removed from today.'
              );

              router.replace('/(tabs)/meals');
            } catch (error) {
              console.error(
                'Meal deletion error:',
                error
              );

              Alert.alert(
                'Could not delete meal',
                'Something went wrong. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.foodCard}>
      <View style={styles.foodIcon}>
        <Text style={styles.foodEmoji}>
          🍽️
        </Text>
      </View>

      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>
          {food.food_name}
        </Text>

        {quantityText ? (
          <Text style={styles.quantity}>
            {quantityText}
          </Text>
        ) : null}

        {/* Main nutrition */}
        <View style={styles.mainNutritionRow}>
          <Text style={styles.calories}>
            {Math.round(
              Number(food.calories ?? 0)
            )}{' '}
            kcal
          </Text>

          <Text style={styles.protein}>
            {Math.round(
              Number(food.protein_g ?? 0)
            )}
            g protein
          </Text>
        </View>

        {/* Detailed nutrition */}
        <View style={styles.detailNutritionRow}>
          <NutritionItem
            value={food.carbs_g}
            label="Carbs"
          />

          <NutritionItem
            value={food.fat_g}
            label="Fat"
          />

          <NutritionItem
            value={food.fiber_g}
            label="Fiber"
          />

          <NutritionItem
            value={food.sugar_g}
            label="Sugar"
          />
        </View>

        {/* Meal category */}
        {food.meal_type ? (
          <View style={styles.mealTypeBadge}>
            <Text style={styles.mealTypeText}>
              {formatMealType(food.meal_type)}
            </Text>
          </View>
        ) : null}

        {/* Edit and Delete */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.8}
            onPress={handleEdit}
          >
            <Text style={styles.editButtonText}>
              ✏️ Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.8}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>
              🗑️ Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function NutritionItem({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  return (
    <View style={styles.nutritionItem}>
      <Text style={styles.nutritionValue}>
        {Math.round(Number(value ?? 0))}g
      </Text>

      <Text style={styles.nutritionLabel}>
        {label}
      </Text>
    </View>
  );
}

function formatMealType(
  mealType: MealType
) {
  switch (mealType) {
    case 'breakfast':
      return 'Breakfast';

    case 'lunch':
      return 'Lunch';

    case 'snack':
      return 'Snacks';

    case 'dinner':
      return 'Dinner';

    case 'miscellaneous':
      return 'Miscellaneous';

    default:
      return mealType;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 58,
    paddingBottom: 40,
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

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#9B4F70',
  },

  addCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    backgroundColor: '#FFFFFF',
  },

  addIcon: {
    marginTop: -2,
    fontSize: 28,
    color: '#9B4F70',
  },

  addButtonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  addButtonSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#F7DCE7',
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: '800',
    color: '#302229',
  },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: 35,
  },

  loadingText: {
    marginTop: 9,
    fontSize: 12,
    color: '#806C75',
  },

  emptyCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DEE5',
  },

  emptyEmoji: {
    fontSize: 34,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#403039',
  },

  emptyText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#958089',
  },

  foodCard: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DEE5',
  },

  foodIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF1F5',
  },

  foodEmoji: {
    fontSize: 22,
  },

  foodInfo: {
    flex: 1,
    marginLeft: 13,
  },

  foodName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#403039',
  },

  quantity: {
    marginTop: 3,
    fontSize: 11,
    color: '#9A858D',
  },

  mainNutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  calories: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E4566',
  },

  protein: {
    marginLeft: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#806C75',
  },

  detailNutritionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 11,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#F5E7EC',
  },

  nutritionItem: {
    minWidth: 55,
    marginRight: 10,
    marginBottom: 5,
  },

  nutritionValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#403039',
  },

  nutritionLabel: {
    marginTop: 2,
    fontSize: 9,
    color: '#9A858D',
  },

  mealTypeBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FDF1F5',
  },

  mealTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9B4F70',
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },

  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FDF1F5',
    borderWidth: 1,
    borderColor: '#F0D5E0',
  },

  editButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9B4F70',
  },

  deleteButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#F3D1D1',
  },

  deleteButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B54B55',
  },

  mealSectionTitle: {
    marginTop: 24,
    marginBottom: 11,
    fontSize: 16,
    fontWeight: '800',
    color: '#403039',
  },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DEE5',
  },

  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF1F5',
  },

  categoryEmoji: {
    fontSize: 20,
  },

  categoryInfo: {
    marginLeft: 12,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#403039',
  },

  categoryStatus: {
    marginTop: 3,
    fontSize: 11,
    color: '#9A858D',
  },
});