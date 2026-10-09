import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useCallback,
  useState,
} from 'react';

import {
  useFocusEffect,
} from 'expo-router';

import { supabase } from '../../lib/supabase';

import {
  getDailyNutrition,
  type DailyNutrition,
} from '../../services/dailyNutrition';

export default function HomeScreen() {

  const [userName, setUserName] =

    useState('there');



  const [nutrition, setNutrition] =

    useState<DailyNutrition>({

      calories: 0,

      protein: 0,

      fiber: 0,

      sugar: 0,
      calorieTarget: null,

      proteinTarget: null,

      fiberTarget: null,

      sugarTarget: null,

      waterTargetMl: null,
      stepsTarget: null,
      exerciseMinutesTarget: null,
      sleepHoursTarget: null,

    });



  const [loadingNutrition, setLoadingNutrition] =

    useState(true);



  const loadDashboard =

    useCallback(async () => {

      try {

        setLoadingNutrition(true);



        const {

          data: { user },

          error: userError,

        } =

          await supabase.auth.getUser();



        if (userError) {

          throw userError;

        }



        if (!user) {

          return;

        }



        /*

         * First try the profile table.

         *

         * This is more reliable than only

         * depending on auth metadata because

         * our You page saves the user's name

         * into profiles.

         */

        const {

          data: profile,

          error: profileError,

        } =

          await supabase

            .from('profiles')

            .select('full_name')

            .eq('id', user.id)

            .maybeSingle();



        if (profileError) {

          throw profileError;

        }



        const profileName =

          profile?.full_name;



        const metadataName =

          user.user_metadata?.full_name;



        if (profileName) {

          setUserName(profileName);

        } else if (metadataName) {

          setUserName(metadataName);

        } else {

          setUserName('there');

        }



        /*

         * Use today's local calendar date.

         *

         * We avoid toISOString() here because

         * it can shift the date around midnight

         * depending on timezone.

         */

        const now =

          new Date();
        const year =
          now.getFullYear();
        const month =
          String(
            now.getMonth() + 1
          ).padStart(2, '0');

        const day =

          String(

            now.getDate()

          ).padStart(2, '0');



        const today =

          `${year}-${month}-${day}`;



        const dailyNutrition =

          await getDailyNutrition(

            today

          );



        setNutrition(

          dailyNutrition

        );

      } catch (error) {

        console.error(

          'Dashboard loading error:',

          error

        );

      } finally {

        setLoadingNutrition(false);

      }

    }, []);



  /*

   * Refresh the dashboard whenever

   * the Today tab becomes active.

   */

  useFocusEffect(

    useCallback(() => {

      loadDashboard();

    }, [loadDashboard])

  );



  const calorieTarget =

    nutrition.calorieTarget;



  const proteinTarget =

    nutrition.proteinTarget;



  const fiberTarget =

    nutrition.fiberTarget;



  const sugarTarget =

    nutrition.sugarTarget;



  const waterTargetMl =

    nutrition.waterTargetMl;

  const stepsTarget =
    nutrition.stepsTarget;

  const exerciseMinutesTarget =
    nutrition.exerciseMinutesTarget;

  const sleepHoursTarget =
    nutrition.sleepHoursTarget;



  /*

   * Convert water target from ml

   * to litres for the UI.

   */

  const waterTargetLitres =

    waterTargetMl !== null

      ? waterTargetMl / 1000

      : null;



  const calorieProgress =

    calorieTarget !== null &&

    calorieTarget > 0

      ? Math.min(

          nutrition.calories /

            calorieTarget,

          1

        )

      : 0;



  const proteinProgress =

    proteinTarget !== null &&

    proteinTarget > 0

      ? Math.min(

          nutrition.protein /

            proteinTarget,

          1

        )

      : 0;



  const fiberProgress =

    fiberTarget !== null &&

    fiberTarget > 0

      ? Math.min(

          nutrition.fiber /

            fiberTarget,

          1

        )

      : 0;



  /*

   * If no sugar target exists yet,

   * progress is intentionally 0.

   */

  const sugarProgress =

    sugarTarget !== null &&

    sugarTarget > 0

      ? Math.min(

          nutrition.sugar /

            sugarTarget,

          1

        )

      : 0;



  return (

    <View style={styles.container}>

      <ScrollView

        showsVerticalScrollIndicator={

          false

        }

        contentContainerStyle={

          styles.scrollContent

        }

      >

        {/* Header */}



        <View style={styles.header}>

          <View>

            <Text style={styles.greeting}>

              {userName} ✨

            </Text>



            <Text

              style={styles.subtitle}

            >

              Here's your progress for today

            </Text>

          </View>



          <View

            style={styles.profileCircle}

          >

            <Text

              style={styles.profileIcon}

            >

              ♡

            </Text>

          </View>

        </View>



        {/* Date */}



        <Text

          style={styles.dateLabel}

        >

          TODAY

        </Text>



        {/* Main Progress Card */}



        <View

          style={styles.mainCard}

        >

          <View

            style={styles.cardHeader}

          >

            <View>

              <Text

                style={

                  styles.cardEyebrow

                }

              >

                DAILY PROGRESS

              </Text>



              <Text

                style={

                  styles.cardTitle

                }

              >

                Your day at a glance

              </Text>

            </View>



            <View

              style={

                styles.progressBadge

              }

            >

              <Text

                style={

                  styles.progressBadgeText

                }

              >

                {stepsTarget && stepsTarget > 0 ? '0%' : '—'}

              </Text>

            </View>

          </View>



          <View

            style={

              styles.progressCircle

            }

          >

            <Text

              style={

                styles.progressNumber

              }

            >

              0

            </Text>



            <Text

              style={

                styles.progressUnit

              }

            >

              / {stepsTarget ? stepsTarget.toLocaleString() : '—'}

            </Text>



            <Text

              style={

                styles.progressLabel

              }

            >

              steps

            </Text>

          </View>



          <Text

            style={

              styles.encouragement

            }

          >

            {stepsTarget
              ? `Your daily step target is ${stepsTarget.toLocaleString()}. ✨`
              : 'Create your AMORA plan to unlock your daily targets. ✨'}

          </Text>

        </View>



        {/* Nutrition Stats */}



        <View

          style={styles.statsGrid}

        >

          <ProgressCard

            icon="🔥"

            title="Calories"

            current={

              loadingNutrition

                ? '...'

                : Math.round(

                    nutrition.calories

                  ).toString()

            }

            target={

              calorieTarget !== null

                ? `${Math.round(

                    calorieTarget

                  )} kcal`

                : 'Target not set'

            }

            progress={

              calorieProgress

            }

          />



          <ProgressCard

            icon="🥗"

            title="Protein"

            current={

              loadingNutrition

                ? '...'

                : `${Math.round(

                    nutrition.protein

                  )} g`

            }

            target={

              proteinTarget !== null

                ? `${Math.round(

                    proteinTarget

                  )} g`

                : 'Target not set'

            }

            progress={

              proteinProgress

            }

          />



          <ProgressCard

            icon="🌾"

            title="Fiber"

            current={

              loadingNutrition

                ? '...'

                : `${Math.round(

                    nutrition.fiber

                  )} g`

            }

            target={

              fiberTarget !== null

                ? `${Math.round(

                    fiberTarget

                  )} g`

                : 'Target not set'

            }

            progress={

              fiberProgress

            }

          />



          <ProgressCard

            icon="🍬"

            title="Sugar"

            current={

              loadingNutrition

                ? '...'

                : `${Math.round(

                    nutrition.sugar

                  )} g`

            }

            target={

              sugarTarget !== null

                ? `${Math.round(

                    sugarTarget

                  )} g`

                : 'Target not set'

            }

            progress={

              sugarProgress

            }

          />



          <ProgressCard
            icon="💧"
            title="Water"
            current="0 L"
            target={
              waterTargetLitres !== null
                ? `${waterTargetLitres.toFixed(1)} L`
                : 'Target not set'
            }
            progress={0}
          />

          <ProgressCard
            icon="🏋️"
            title="Workout"
            current="0 min"
            target={
              exerciseMinutesTarget !== null
                ? `${exerciseMinutesTarget} min`
                : 'Target not set'
            }
            progress={0}
          />

          <ProgressCard
            icon="👟"
            title="Steps"
            current="0"
            target={
              stepsTarget !== null
                ? stepsTarget.toLocaleString()
                : 'Target not set'
            }
            progress={0}
          />

          <ProgressCard
            icon="😴"
            title="Sleep"
            current="—"
            target={
              sleepHoursTarget !== null
                ? `${sleepHoursTarget} hrs`
                : 'Target not set'
            }
            progress={0}
          />
</View>



        {/* AI Insight */}



        <View

          style={styles.aiCard}

        >

          <View

            style={styles.aiIcon}

          >

            <Text

              style={

                styles.aiIconText

              }

            >

              ✦

            </Text>

          </View>



          <View

            style={styles.aiContent}

          >

            <Text

              style={styles.aiTitle}

            >

              Your AMORA insight

            </Text>



            <Text

              style={styles.aiText}

            >

              Start by logging your first meal,

              water, or activity. I'll help you

              understand your day as it progresses.

            </Text>

          </View>

        </View>



        <View

          style={styles.bottomSpace}

        />

      </ScrollView>

    </View>

  );

}



/* Progress card */



function ProgressCard({

  icon,

  title,

  current,

  target,

  progress,

}: {

  icon: string;

  title: string;

  current: string;

  target: string;

  progress: number;

}) {

  return (

    <View

      style={styles.statCard}

    >

      <View

        style={styles.statTopRow}

      >

        <Text

          style={styles.statIcon}

        >

          {icon}

        </Text>



        <Text

          style={styles.statTitle}

        >

          {title}

        </Text>

      </View>



      <Text

        style={styles.statCurrent}

      >

        {current}

      </Text>



      <Text

        style={styles.statTarget}

      >

        / {target}

      </Text>



      <View

        style={

          styles.statProgressTrack

        }

      >

        <View

          style={[

            styles.statProgressFill,

            {

              width: `${Math.min(

                Math.max(progress, 0),

                1

              ) * 100}%`,

            },

          ]}

        />

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#FFF8FA',

  },



  scrollContent: {

    paddingHorizontal: 22,

    paddingTop: 58,

    paddingBottom: 30,

  },



  header: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:

      'space-between',

  },



  greeting: {

    fontSize: 27,

    fontWeight: '800',

    color: '#302229',

    letterSpacing: -0.5,

  },



  subtitle: {

    marginTop: 5,

    fontSize: 14,

    color: '#806C75',

  },



  profileCircle: {

    width: 46,

    height: 46,

    borderRadius: 23,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F3DFE8',

    borderWidth: 1,

    borderColor: '#E8CCD8',

  },



  profileIcon: {

    fontSize: 20,

    color: '#8E4566',

  },



  dateLabel: {

    marginTop: 30,

    fontSize: 11,

    fontWeight: '800',

    letterSpacing: 2,

    color: '#A65A7B',

  },



  mainCard: {

    marginTop: 10,

    padding: 22,

    borderRadius: 28,

    backgroundColor: '#9B4F70',

  },



  cardHeader: {

    flexDirection: 'row',

    justifyContent:

      'space-between',

    alignItems: 'flex-start',

  },



  cardEyebrow: {

    fontSize: 10,

    fontWeight: '800',

    letterSpacing: 1.7,

    color: '#F7DCE7',

  },



  cardTitle: {

    marginTop: 5,

    fontSize: 19,

    fontWeight: '800',

    color: '#FFFFFF',

  },



  progressBadge: {

    paddingHorizontal: 11,

    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor:

      'rgba(255,255,255,0.16)',

  },



  progressBadgeText: {

    fontSize: 11,

    fontWeight: '800',

    color: '#FFFFFF',

  },



  progressCircle: {

    width: 150,

    height: 150,

    borderRadius: 75,

    marginTop: 24,

    alignSelf: 'center',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 10,

    borderColor: '#D7AABD',

  },



  progressNumber: {

    fontSize: 34,

    fontWeight: '800',

    color: '#FFFFFF',

  },



  progressUnit: {

    marginTop: -2,

    fontSize: 12,

    color: '#F7DCE7',

  },



  progressLabel: {

    marginTop: 3,

    fontSize: 12,

    fontWeight: '700',

    color: '#FFFFFF',

  },



  encouragement: {

    marginTop: 17,

    textAlign: 'center',

    fontSize: 13,

    color: '#F9E9EF',

  },



  statsGrid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent:

      'space-between',

    marginTop: 14,

  },



  statCard: {

    width: '48.2%',

    minHeight: 145,

    marginBottom: 12,

    padding: 16,

    borderRadius: 21,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#F0DEE5',

  },



  statTopRow: {

    flexDirection: 'row',

    alignItems: 'center',

  },



  statIcon: {

    fontSize: 18,

  },



  statTitle: {

    marginLeft: 7,

    fontSize: 12,

    fontWeight: '700',

    color: '#6E5962',

  },



  statCurrent: {

    marginTop: 14,

    fontSize: 25,

    fontWeight: '800',

    color: '#302229',

  },



  statTarget: {

    marginTop: -2,

    fontSize: 11,

    color: '#9A858D',

  },



  statProgressTrack: {

    height: 5,

    marginTop: 13,

    borderRadius: 5,

    backgroundColor: '#F0E3E8',

    overflow: 'hidden',

  },



  statProgressFill: {

    height: '100%',

    borderRadius: 5,

    backgroundColor: '#B86B8B',

  },



  aiCard: {

    flexDirection: 'row',

    marginTop: 18,

    padding: 17,

    borderRadius: 22,

    backgroundColor: '#FDF1F5',

    borderWidth: 1,

    borderColor: '#F0DDE5',

  },



  aiIcon: {

    width: 38,

    height: 38,

    borderRadius: 19,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#EBD0DC',

  },



  aiIconText: {

    fontSize: 19,

    color: '#8E4566',

  },



  aiContent: {

    flex: 1,

    marginLeft: 12,

  },



  aiTitle: {

    fontSize: 13,

    fontWeight: '800',

    color: '#684555',

  },



  aiText: {

    marginTop: 5,

    fontSize: 12,

    lineHeight: 18,

    color: '#806B74',

  },



  bottomSpace: {

    height: 20,

  },

});